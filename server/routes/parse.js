const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const natural = require('natural');
const { createWorker } = require('tesseract.js');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Only allow doc, docx, csv, xls, xlsx formats
    const allowedExtensions = ['.doc', '.docx', '.csv', '.xls', '.xlsx'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    const extname = allowedExtensions.includes(fileExt);
    
    // Check mimetype (some browsers may not set it correctly for CSV/Excel)
    const allowedMimeTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/csv',
      'application/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const mimetype = !file.mimetype || allowedMimeTypes.includes(file.mimetype);

    if (extname && (mimetype || extname)) {
      return cb(null, true);
    } else {
      cb(new Error('Only DOC, DOCX, CSV, XLS, and XLSX files are allowed'));
    }
  }
});

// Extract text from PDF
async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    throw new Error(`Error extracting text from PDF: ${error.message}`);
  }
}

// Extract text from DOCX
async function extractTextFromDOCX(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    throw new Error(`Error extracting text from DOCX: ${error.message}`);
  }
}

// Extract text from image using OCR
async function extractTextFromImage(filePath) {
  try {
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(filePath);
    await worker.terminate();
    return text;
  } catch (error) {
    throw new Error(`Error extracting text from image: ${error.message}`);
  }
}

// Extract text from CSV file
async function extractTextFromCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        // Convert CSV data to text format for parsing
        let text = '';
        if (results.length > 0) {
          // Get headers
          const headers = Object.keys(results[0]);
          text += headers.join(', ') + '\n';
          // Add rows
          results.forEach(row => {
            text += headers.map(h => row[h] || '').join(', ') + '\n';
          });
        }
        resolve(text);
      })
      .on('error', (error) => {
        reject(new Error(`Error reading CSV file: ${error.message}`));
      });
  });
}

// Extract text from Excel file (XLS or XLSX)
async function extractTextFromExcel(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    let text = '';
    
    // Iterate through all sheets
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      // Convert sheet to CSV format, then to text
      const csvData = XLSX.utils.sheet_to_csv(worksheet);
      text += `Sheet: ${sheetName}\n${csvData}\n\n`;
    });
    
    return text;
  } catch (error) {
    throw new Error(`Error extracting text from Excel file: ${error.message}`);
  }
}

// Parse extracted text using NLP
function parseProjectData(text) {
  const projectData = {};
  
  // Use natural language processing to extract key-value pairs
  const tokenizer = new natural.WordTokenizer();
  const sentences = text.split(/[.!?]+/);
  
  // Common patterns for project information
  const patterns = {
    projectName: /(?:project name|project title)[:：]?\s*([^\n]+)/i,
    shortProjectName: /(?:short project name|project alias)[:：]?\s*([^\n]+)/i,
    workdayId: /(?:workday project id|workday id)[:：]?\s*([^\n]+)/i,
    projectType: /(?:project type)[:：]?\s*([^\n]+)/i,
    priority: /(?:project priority|priority)[:：]?\s*([^\d]+)?(\d+\.?\d*)/i,
    hireStartDate: /(?:hire start date|start date)[:：]?\s*([^\n]+)/i,
    predictedCloseDate: /(?:predicted close date|close date|end date)[:：]?\s*([^\n]+)/i,
    account: /(?:account|client)[:：]?\s*([^\n]+)/i,
    programName: /(?:program name)[:：]?\s*([^\n]+)/i,
    deliveryTool: /(?:delivery tool)[:：]?\s*([^\n]+)/i,
    projectStatus: /(?:project status|status)[:：]?\s*([^\n]+)/i,
    paymentMethod: /(?:payment method|project payment method)[:：]?\s*([^\n]+)/i,
    languages: /(?:language|languages)[:：]?\s*([^\n]+)/i,
    budget: /(?:budget|total|total \$)[:：]?\s*\$?([\d,]+\.?\d*)/i,
    hours: /(?:hours|total hours)[:：]?\s*(\d+)/i
  };

  // Extract data using patterns
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match) {
      let value = match[1] || match[2] || match[0];
      // Clean up the value - remove "Example:" prefix and trim
      value = value.replace(/^(example|eg|e\.g\.)[:：]?\s*/i, '').trim();
      projectData[key] = value;
    }
  }

  // Extract short description - look for "Project Short Description" or "Short Description"
  const shortDescMatch = text.match(/(?:project short description|short description)[:：]?\s*(.+?)(?=\n(?:project long description|long description|project type|$))/is);
  if (shortDescMatch) {
    let shortDesc = shortDescMatch[1].trim();
    // Remove "Example:" prefix if present
    shortDesc = shortDesc.replace(/^(example|eg|e\.g\.)[:：]?\s*/i, '').trim();
    // If it contains "Example:", extract only the example part
    const exampleMatch = shortDesc.match(/example[:：]?\s*(.+?)(?:\n|$)/i);
    if (exampleMatch) {
      shortDesc = exampleMatch[1].trim();
    }
    projectData.projectShortDescription = shortDesc;
  }

  // Extract long description - look for "Project Long Description" or "Long Description"
  const longDescMatch = text.match(/(?:project long description|long description)[:：]?\s*(.+?)(?=\n(?:project type|project priority|requirements|$))/is);
  if (longDescMatch) {
    let longDesc = longDescMatch[1].trim();
    // Remove "Example:" prefix if present
    longDesc = longDesc.replace(/^(example|eg|e\.g\.)[:：]?\s*/i, '').trim();
    // If it contains "Example:", extract only the example part
    const exampleMatch = longDesc.match(/example[:：]?\s*(.+?)(?:\n(?:project type|project priority|requirements|$))/i);
    if (exampleMatch) {
      longDesc = exampleMatch[1].trim();
    }
    projectData.projectLongDescription = longDesc;
  }

  // Extract table data (common in project documents)
  const tablePattern = /\|([^|]+)\|([^|]+)\|/g;
  const tables = [];
  let match;
  while ((match = tablePattern.exec(text)) !== null) {
    tables.push({ key: match[1].trim(), value: match[2].trim() });
  }

  // Extract URLs
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const urls = text.match(urlPattern) || [];
  if (urls.length > 0) {
    projectData.urls = urls;
  }

  // Extract dates
  const datePattern = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g;
  const dates = text.match(datePattern) || [];
  if (dates.length > 0) {
    projectData.dates = dates;
  }

  return {
    extractedData: projectData,
    rawText: text,
    tables: tables,
    confidence: 0.7 // Confidence score (0-1)
  };
}

// Parse document endpoint
router.post('/document', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    let extractedText = '';

    // Extract text based on file type
    // Only support doc, docx, csv, xls, xlsx formats
    switch (fileExt) {
      case '.docx':
      case '.doc':
        extractedText = await extractTextFromDOCX(filePath);
        break;
      case '.csv':
        extractedText = await extractTextFromCSV(filePath);
        break;
      case '.xls':
      case '.xlsx':
        extractedText = await extractTextFromExcel(filePath);
        break;
      default:
        throw new Error('Unsupported file type. Only DOC, DOCX, CSV, XLS, and XLSX files are supported.');
    }

    // Parse the extracted text
    const parsedData = parseProjectData(extractedText);

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({
      ...parsedData,
      fileName: req.file.originalname,
      fileType: fileExt
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(400).json({ 
      error: 'Error parsing document', 
      details: error.message 
    });
  }
});

module.exports = router;


// Script to analyze all file sizes in the application

const fs = require('fs');
const path = require('path');

// Directories to analyze
const sourceDirs = [
  'client/src',
  'server'
];

// Directories to ignore
const ignoreDirs = [
  'node_modules',
  'build',
  '.git',
  'uploads',
  'data/drafts'
];

// File extensions to include
const includeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.css'];

// Function to check if path should be ignored
function shouldIgnore(filePath) {
  const parts = filePath.split(path.sep);
  return ignoreDirs.some(dir => parts.includes(dir));
}

// Function to recursively get all files
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    
    if (shouldIgnore(filePath)) {
      return;
    }

    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      const ext = path.extname(file);
      if (includeExtensions.includes(ext) || ext === '') {
        arrayOfFiles.push(filePath);
      }
    }
  });

  return arrayOfFiles;
}

// Function to count lines in a file
function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').length;
  } catch (error) {
    return 0;
  }
}

// Main analysis
const allFiles = [];
sourceDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = getAllFiles(dir);
    allFiles.push(...files);
  }
});

// Analyze files
const fileSizes = allFiles.map(filePath => {
  const lines = countLines(filePath);
  const relativePath = filePath.replace(/\\/g, '/');
  return {
    path: relativePath,
    lines: lines,
    size: fs.statSync(filePath).size
  };
});

// Sort by line count (descending)
fileSizes.sort((a, b) => b.lines - a.lines);

// Generate report
console.log('='.repeat(80));
console.log('FILE SIZE ANALYSIS REPORT');
console.log('='.repeat(80));
console.log(`\nTotal Files Analyzed: ${fileSizes.length}`);
console.log(`Total Lines of Code: ${fileSizes.reduce((sum, f) => sum + f.lines, 0).toLocaleString()}`);
console.log(`Total File Size: ${(fileSizes.reduce((sum, f) => sum + f.size, 0) / 1024).toFixed(2)} KB\n`);

// Files by size categories
const categories = {
  'Very Large (1000+ lines)': [],
  'Large (500-999 lines)': [],
  'Medium (200-499 lines)': [],
  'Small (100-199 lines)': [],
  'Very Small (<100 lines)': []
};

fileSizes.forEach(file => {
  if (file.lines >= 1000) {
    categories['Very Large (1000+ lines)'].push(file);
  } else if (file.lines >= 500) {
    categories['Large (500-999 lines)'].push(file);
  } else if (file.lines >= 200) {
    categories['Medium (200-499 lines)'].push(file);
  } else if (file.lines >= 100) {
    categories['Small (100-199 lines)'].push(file);
  } else {
    categories['Very Small (<100 lines)'].push(file);
  }
});

// Print by category
Object.keys(categories).forEach(category => {
  const files = categories[category];
  if (files.length > 0) {
    console.log(`\n${category}: ${files.length} files`);
    console.log('-'.repeat(80));
    files.forEach(file => {
      console.log(`  ${file.lines.toString().padStart(6)} lines  ${file.path}`);
    });
  }
});

// Top 20 largest files
console.log('\n\n' + '='.repeat(80));
console.log('TOP 20 LARGEST FILES');
console.log('='.repeat(80));
fileSizes.slice(0, 20).forEach((file, index) => {
  console.log(`${(index + 1).toString().padStart(2)}. ${file.lines.toString().padStart(6)} lines  ${file.path}`);
});

// Summary by directory
console.log('\n\n' + '='.repeat(80));
console.log('SUMMARY BY DIRECTORY');
console.log('='.repeat(80));

const dirStats = {};
fileSizes.forEach(file => {
  const dir = path.dirname(file.path);
  if (!dirStats[dir]) {
    dirStats[dir] = { files: 0, lines: 0 };
  }
  dirStats[dir].files++;
  dirStats[dir].lines += file.lines;
});

const sortedDirs = Object.entries(dirStats)
  .sort((a, b) => b[1].lines - a[1].lines)
  .slice(0, 30);

sortedDirs.forEach(([dir, stats]) => {
  console.log(`${stats.lines.toString().padStart(6)} lines  (${stats.files} files)  ${dir}`);
});

console.log('\n' + '='.repeat(80));


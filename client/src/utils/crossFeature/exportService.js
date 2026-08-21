// Universal Export Service - Supports CSV, Excel, and PDF exports

import * as XLSX from 'xlsx';

// PDF support
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Export data to Excel
 * @param {Array} data - Array of objects
 * @param {string} filename - Output filename
 * @param {string} sheetName - Sheet name (default: 'Sheet1')
 */
export const exportToExcel = (data, filename = 'export', sheetName = 'Sheet1') => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // Convert data to worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const fullFilename = `${filename}_${timestamp}.xlsx`;

    // Write and download
    XLSX.writeFile(wb, fullFilename);
    return { success: true, filename: fullFilename };
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export data to CSV
 * @param {Array} data - Array of objects
 * @param {string} filename - Output filename
 */
export const exportToCSV = (data, filename = 'export') => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // Convert to CSV
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().split('T')[0];
    const fullFilename = `${filename}_${timestamp}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fullFilename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return { success: true, filename: fullFilename };
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export data to PDF
 * @param {Array} data - Array of objects
 * @param {string} filename - Output filename
 * @param {string} title - PDF title
 */
export const exportToPDF = (data, filename = 'export', title = 'Export Report') => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    
    // Prepare table data
    const headers = Object.keys(data[0]);
    const rows = data.map(item => headers.map(header => item[header] || ''));
    
    // Add table
    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 25,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [1, 118, 211] } // #0176d3
    });
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const fullFilename = `${filename}_${timestamp}.pdf`;
    
    // Save
    doc.save(fullFilename);
    return { success: true, filename: fullFilename };
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Universal export function - detects format from filename or uses default
 * @param {Array} data - Array of objects
 * @param {string} filename - Output filename (with or without extension)
 * @param {string} format - Format: 'excel', 'csv', 'pdf' (optional, auto-detected from filename)
 */
export const exportData = (data, filename = 'export', format = null) => {
  // Auto-detect format from filename
  if (!format) {
    if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      format = 'excel';
    } else if (filename.endsWith('.csv')) {
      format = 'csv';
    } else if (filename.endsWith('.pdf')) {
      format = 'pdf';
    } else {
      format = 'excel'; // Default
    }
  }
  
  // Remove extension from filename if present
  const baseFilename = filename.replace(/\.(xlsx|xls|csv|pdf)$/i, '');
  
  switch (format.toLowerCase()) {
    case 'excel':
    case 'xlsx':
      return exportToExcel(data, baseFilename);
    case 'csv':
      return exportToCSV(data, baseFilename);
    case 'pdf':
      return exportToPDF(data, baseFilename);
    default:
      return { success: false, error: `Unsupported format: ${format}` };
  }
};


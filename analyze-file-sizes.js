const fs = require('fs');
const path = require('path');

// Directories to exclude
const EXCLUDE_DIRS = ['node_modules', '.git', 'build', 'dist', '.next', 'coverage'];

// File extensions to include
const INCLUDE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.md'];

function shouldExclude(filePath) {
  const parts = filePath.split(path.sep);
  return EXCLUDE_DIRS.some(dir => parts.includes(dir));
}

function getFileExtension(filePath) {
  return path.extname(filePath).toLowerCase();
}

function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').length;
  } catch (error) {
    return 0;
  }
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!shouldExclude(filePath)) {
        getAllFiles(filePath, fileList);
      }
    } else {
      const ext = getFileExtension(filePath);
      if (INCLUDE_EXTENSIONS.includes(ext) && !shouldExclude(filePath)) {
        const lines = countLines(filePath);
        fileList.push({
          path: filePath,
          lines: lines,
          ext: ext
        });
      }
    }
  });
  
  return fileList;
}

const rootDir = __dirname;
const allFiles = getAllFiles(rootDir);

// Sort by line count (descending)
allFiles.sort((a, b) => b.lines - a.lines);

// Group by directory
const byDirectory = {};
allFiles.forEach(file => {
  const dir = path.dirname(file.path).replace(rootDir, '').replace(/^\//, '') || 'root';
  if (!byDirectory[dir]) {
    byDirectory[dir] = [];
  }
  byDirectory[dir].push(file);
});

// Generate report
let report = '# File Size Analysis Report\n\n';
report += `Generated: ${new Date().toISOString()}\n\n`;
report += `Total Files Analyzed: ${allFiles.length}\n`;
report += `Total Lines of Code: ${allFiles.reduce((sum, f) => sum + f.lines, 0).toLocaleString()}\n\n`;

// Summary by extension
report += '## Summary by File Type\n\n';
const byExtension = {};
allFiles.forEach(file => {
  if (!byExtension[file.ext]) {
    byExtension[file.ext] = { count: 0, lines: 0 };
  }
  byExtension[file.ext].count++;
  byExtension[file.ext].lines += file.lines;
});

Object.keys(byExtension).sort().forEach(ext => {
  const data = byExtension[ext];
  report += `- **${ext || 'no extension'}**: ${data.count} files, ${data.lines.toLocaleString()} lines\n`;
});

// Files over 1000 lines
report += '\n## Files Over 1000 Lines\n\n';
const largeFiles = allFiles.filter(f => f.lines > 1000);
report += `Found ${largeFiles.length} files with more than 1000 lines:\n\n`;
largeFiles.forEach(file => {
  const relPath = file.path.replace(rootDir + '/', '');
  report += `- **${relPath}**: ${file.lines.toLocaleString()} lines\n`;
});

// Files over 500 lines
report += '\n## Files Over 500 Lines\n\n';
const mediumFiles = allFiles.filter(f => f.lines > 500 && f.lines <= 1000);
report += `Found ${mediumFiles.length} files with 500-1000 lines:\n\n`;
mediumFiles.forEach(file => {
  const relPath = file.path.replace(rootDir + '/', '');
  report += `- **${relPath}**: ${file.lines.toLocaleString()} lines\n`;
});

// Detailed breakdown by directory
report += '\n## Detailed Breakdown by Directory\n\n';
Object.keys(byDirectory).sort().forEach(dir => {
  const files = byDirectory[dir];
  const totalLines = files.reduce((sum, f) => sum + f.lines, 0);
  report += `### ${dir || 'root'} (${files.length} files, ${totalLines.toLocaleString()} lines)\n\n`;
  
  files.sort((a, b) => b.lines - a.lines);
  files.forEach(file => {
    const fileName = path.basename(file.path);
    report += `- ${fileName}: ${file.lines.toLocaleString()} lines\n`;
  });
  report += '\n';
});

// Top 20 largest files
report += '\n## Top 20 Largest Files\n\n';
allFiles.slice(0, 20).forEach((file, index) => {
  const relPath = file.path.replace(rootDir + '/', '');
  report += `${index + 1}. **${relPath}**: ${file.lines.toLocaleString()} lines\n`;
});

console.log(report);

// Write to file
fs.writeFileSync(path.join(rootDir, 'FILE_SIZE_ANALYSIS.md'), report);
console.log('\nReport saved to FILE_SIZE_ANALYSIS.md');


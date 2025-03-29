const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, 'node_modules', 'pdfjs-dist', 'standard_fonts');
const destDir = path.join(__dirname, 'public', 'standard_fonts');

try {
  if (!fs.existsSync(sourceDir)) {
    console.error(`Source directory not found: ${sourceDir}`);
    process.exit(1);
  }

  // Ensure destination directory exists (fs.cpSync requires parent to exist)
  const destParent = path.dirname(destDir);
   if (!fs.existsSync(destParent)) {
     fs.mkdirSync(destParent, { recursive: true });
     console.log(`Created destination parent directory: ${destParent}`);
   }

  console.log(`Copying fonts from ${sourceDir} to ${destDir}...`);
  fs.cpSync(sourceDir, destDir, { recursive: true });
  console.log('Successfully copied standard_fonts directory.');

} catch (err) {
  console.error('Error copying fonts directory:', err);
  process.exit(1);
}

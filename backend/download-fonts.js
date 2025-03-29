const fs = require('fs');
const path = require('path');
const https = require('https');

// Create fonts directory if it doesn't exist
const fontsDir = path.join(__dirname, 'fonts');
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir);
}

// Font URLs
const fonts = [
  {
    name: 'Roboto-Regular.ttf',
    url: 'https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-latin-400-normal.woff2'
  },
  {
    name: 'Roboto-Medium.ttf',
    url: 'https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-latin-500-normal.woff2'
  },
  {
    name: 'Roboto-Italic.ttf',
    url: 'https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-latin-400-italic.woff2'
  },
  {
    name: 'Roboto-MediumItalic.ttf',
    url: 'https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-latin-500-italic.woff2'
  }
];

// Download function
const downloadFont = (font) => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(fontsDir, font.name);
    const file = fs.createWriteStream(filePath);
    
    https.get(font.url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${font.name}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${font.name}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Delete the file if there was an error
      reject(err);
    });
  });
};

// Download all fonts
const downloadAllFonts = async () => {
  console.log('Downloading fonts...');
  
  try {
    for (const font of fonts) {
      await downloadFont(font);
    }
    console.log('All fonts downloaded successfully!');
  } catch (error) {
    console.error('Error downloading fonts:', error);
  }
};

downloadAllFonts();

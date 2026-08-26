// generate-icon.js
const sharp = require('sharp');
const fs = require('fs');

// Create a simple 1024x1024 blue icon with white text
const svg = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" rx="200" fill="#007AFF"/>
  <text x="512" y="512" font-family="Arial" font-size="300" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">📋</text>
</svg>
`;

// Ensure assets folder exists
if (!fs.existsSync('./assets')) {
  fs.mkdirSync('./assets');
}

// Generate the icon
sharp(Buffer.from(svg))
  .png()
  .toFile('./assets/icon.png')
  .then(() => console.log('✅ Icon created at assets/icon.png'))
  .catch(err => console.error('❌ Error creating icon:', err));
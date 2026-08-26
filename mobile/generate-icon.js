// mobile/generate-icon.js
const sharp = require('sharp');
const fs = require('fs');

// Ensure assets folder exists
if (!fs.existsSync('./assets')) {
  fs.mkdirSync('./assets');
}

// Common icon configurations
const icons = [
  { name: 'icon.png', size: 1024, bg: '#007AFF', text: '📋' },
  { name: 'adaptive-icon.png', size: 1024, bg: '#007AFF', text: '📋' },
  { name: 'splash.png', size: 1242, bg: '#007AFF', text: '📋' },
  { name: 'favicon.png', size: 256, bg: '#007AFF', text: '📋' },
  { name: 'android-icon-background.png', size: 1024, bg: '#007AFF', text: '📋' },
  { name: 'android-icon-foreground.png', size: 1024, bg: 'transparent', text: '📋' },
  { name: 'android-icon-monochrome.png', size: 1024, bg: 'black', text: '📋' }
];

// Generate each icon
icons.forEach(({ name, size, bg, text }) => {
  const svg = `
  <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    ${bg !== 'transparent' ? `<rect width="${size}" height="${size}" rx="${size * 0.2}" fill="${bg}"/>` : ''}
    <text x="${size/2}" y="${size/2}" font-family="Arial" font-size="${size * 0.4}" 
          font-weight="bold" fill="${bg === 'black' ? 'white' : 'white'}" 
          text-anchor="middle" dominant-baseline="central">${text}</text>
  </svg>`;

  sharp(Buffer.from(svg))
    .png()
    .toFile(`./assets/${name}`)
    .then(() => console.log(`✅ Created ${name}`))
    .catch(err => console.error(`❌ Error creating ${name}:`, err));
});
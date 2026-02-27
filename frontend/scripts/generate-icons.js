const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 72, 96, 128, 144, 152, 180, 192, 384, 512];
const outDir = path.join(__dirname, 'public', 'icons');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function generateSVG(size) {
  const padding = Math.round(size * 0.1);
  const inner = size - padding * 2;
  const fontSize = Math.round(size * 0.35);
  const subFontSize = Math.round(size * 0.12);
  const radius = Math.round(size * 0.18);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#2563eb"/>
  <rect x="${padding}" y="${padding}" width="${inner}" height="${inner}" rx="${Math.round(radius * 0.7)}" fill="white" fill-opacity="0.15"/>
  <text x="${size/2}" y="${size * 0.52}" font-family="Arial,Helvetica,sans-serif" font-size="${fontSize}" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="middle">Ad</text>
  <text x="${size/2}" y="${size * 0.76}" font-family="Arial,Helvetica,sans-serif" font-size="${subFontSize}" font-weight="600" fill="white" fill-opacity="0.85" text-anchor="middle" dominant-baseline="middle">STACK</text>
</svg>`;
}

for (const size of sizes) {
  const svg = generateSVG(size);
  fs.writeFileSync(path.join(outDir, `icon-${size}x${size}.svg`), svg);
  console.log(`Generated icon-${size}x${size}.svg`);
}

console.log('Icon SVGs generated. Convert to PNG for production use.');

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const outDir = path.join(__dirname, '..', 'public', 'icons');

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createPNG(width, height, r, g, b) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 2;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdrType = Buffer.from('IHDR');
  const ihdrCrc = crc32(Buffer.concat([ihdrType, ihdrData]));
  const ihdrChunk = Buffer.alloc(4 + 4 + 13 + 4);
  ihdrChunk.writeUInt32BE(13, 0);
  ihdrType.copy(ihdrChunk, 4);
  ihdrData.copy(ihdrChunk, 8);
  ihdrChunk.writeUInt32BE(ihdrCrc, 21);

  const rawData = Buffer.alloc(height * (1 + width * 3));
  const cornerR = Math.round(width * 0.18);

  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 3);
    rawData[rowStart] = 0;
    for (let x = 0; x < width; x++) {
      const px = rowStart + 1 + x * 3;
      let inside = true;

      if (x < cornerR && y < cornerR) {
        const dx = cornerR - x;
        const dy = cornerR - y;
        inside = (dx * dx + dy * dy) <= cornerR * cornerR;
      } else if (x >= width - cornerR && y < cornerR) {
        const dx = x - (width - cornerR - 1);
        const dy = cornerR - y;
        inside = (dx * dx + dy * dy) <= cornerR * cornerR;
      } else if (x < cornerR && y >= height - cornerR) {
        const dx = cornerR - x;
        const dy = y - (height - cornerR - 1);
        inside = (dx * dx + dy * dy) <= cornerR * cornerR;
      } else if (x >= width - cornerR && y >= height - cornerR) {
        const dx = x - (width - cornerR - 1);
        const dy = y - (height - cornerR - 1);
        inside = (dx * dx + dy * dy) <= cornerR * cornerR;
      }

      if (inside) {
        rawData[px] = r;
        rawData[px + 1] = g;
        rawData[px + 2] = b;
      } else {
        rawData[px] = 255;
        rawData[px + 1] = 255;
        rawData[px + 2] = 255;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatType = Buffer.from('IDAT');
  const idatCrc = crc32(Buffer.concat([idatType, compressed]));
  const idatChunk = Buffer.alloc(4 + 4 + compressed.length + 4);
  idatChunk.writeUInt32BE(compressed.length, 0);
  idatType.copy(idatChunk, 4);
  compressed.copy(idatChunk, 8);
  idatChunk.writeUInt32BE(idatCrc, 8 + compressed.length);

  const iendType = Buffer.from('IEND');
  const iendCrc = crc32(iendType);
  const iendChunk = Buffer.alloc(12);
  iendChunk.writeUInt32BE(0, 0);
  iendType.copy(iendChunk, 4);
  iendChunk.writeUInt32BE(iendCrc, 8);

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const sizes = [16, 32, 72, 96, 128, 144, 152, 180, 192, 384, 512];

for (const size of sizes) {
  const png = createPNG(size, size, 37, 99, 235);
  fs.writeFileSync(path.join(outDir, `icon-${size}x${size}.png`), png);
  console.log(`Generated icon-${size}x${size}.png (${png.length} bytes)`);
}

console.log('All PNG icons generated.');

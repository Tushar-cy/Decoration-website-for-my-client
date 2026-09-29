const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// Helper to write valid uncompressed/deflated RGBA PNG
function createPng(width, height, getPixel) {
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth 8
  ihdr.writeUInt8(6, 9); // color type RGBA (6)
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = makeChunk("IHDR", ihdr);

  // Raw image data with filter byte 0 at start of each scanline
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk("IDAT", compressed);
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, "ascii");
  const crcBody = Buffer.concat([typeBuf, data]);

  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcBody), 0);

  return Buffer.concat([len, crcBody, crcBuf]);
}

// Generate customer brand icon (Gold #b88932 with sparkles/emblem)
function getBrandPixel(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
  const maxR = w / 2;

  // Background: Rich warm gold gradient
  const bgGrad = 1 - (y / h) * 0.3;
  const bgR = Math.min(255, Math.floor(184 * bgGrad));
  const bgG = Math.min(255, Math.floor(137 * bgGrad));
  const bgB = Math.min(255, Math.floor(50 * bgGrad));

  if (isMaskable) {
    // Maskable icons need full bleed background
    // Center emblem circle
    if (r < maxR * 0.42) {
      return [255, 255, 255, 255]; // White inner emblem
    }
    if (r < maxR * 0.46) {
      return [245, 238, 223, 255]; // Soft gold accent ring
    }
    return [bgR, bgG, bgB, 255];
  }

  // Rounded icon with margin
  const cornerRadius = w * 0.22;
  const dx = Math.max(0, Math.abs(x - cx) - (w / 2 - cornerRadius));
  const dy = Math.max(0, Math.abs(y - cy) - (h / 2 - cornerRadius));
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > cornerRadius) {
    return [0, 0, 0, 0]; // Transparent outer
  }

  // Inner emblem
  if (r < maxR * 0.45) {
    return [255, 255, 255, 255]; // White center
  }
  if (r < maxR * 0.5) {
    return [229, 214, 189, 255]; // Gold ring
  }

  return [bgR, bgG, bgB, 255];
}

// Generate admin brand icon (Dark Forest/Emerald #172019 with gold emblem)
function getAdminPixel(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
  const maxR = w / 2;

  const cornerRadius = w * 0.22;
  const dx = Math.max(0, Math.abs(x - cx) - (w / 2 - cornerRadius));
  const dy = Math.max(0, Math.abs(y - cy) - (h / 2 - cornerRadius));
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > cornerRadius) {
    return [0, 0, 0, 0];
  }

  // Admin color: #172019
  if (r < maxR * 0.45) {
    return [184, 137, 50, 255]; // Gold center for admin
  }
  if (r < maxR * 0.5) {
    return [245, 238, 223, 255];
  }

  return [23, 32, 25, 255];
}

// Generate and save icons to client/public
const publicDir = path.join(__dirname, "..", "public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log("Generating PWA icons...");

// 192x192
const pwa192 = createPng(192, 192, (x, y, w, h) => getBrandPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, "pwa-192x192.png"), pwa192);

// 512x512
const pwa512 = createPng(512, 512, (x, y, w, h) => getBrandPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, "pwa-512x512.png"), pwa512);

// Maskable 512x512
const maskable512 = createPng(512, 512, (x, y, w, h) => getBrandPixel(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, "maskable-icon-512x512.png"), maskable512);

// Admin 192x192
const admin192 = createPng(192, 192, (x, y, w, h) => getAdminPixel(x, y, w, h));
fs.writeFileSync(path.join(publicDir, "admin-192x192.png"), admin192);

// Admin 512x512
const admin512 = createPng(512, 512, (x, y, w, h) => getAdminPixel(x, y, w, h));
fs.writeFileSync(path.join(publicDir, "admin-512x512.png"), admin512);

console.log("Icons successfully created in client/public!");

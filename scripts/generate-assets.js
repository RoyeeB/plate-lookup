/**
 * Generates the app's icon / adaptive-icon / splash / favicon PNGs from a
 * simple "yellow Israeli plate" motif — a yellow rounded plate with a blue EU
 * strip and black digit bars on a dark background.
 *
 * Pure Node (zlib only), no image dependencies. Run: `npm run assets`.
 * These are intentionally simple placeholders — swap in real artwork any time.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const YELLOW = [244, 196, 0, 255];
const BLACK = [17, 17, 17, 255];
const BLUE = [0, 51, 160, 255];
const WHITE = [255, 255, 255, 255];
const DARK = [17, 17, 17, 255];
const TRANSPARENT = [0, 0, 0, 0];

function createCanvas(w, h, bg) {
  const buf = new Uint8Array(w * h * 4);
  if (bg) {
    for (let i = 0; i < w * h; i++) {
      buf[i * 4] = bg[0];
      buf[i * 4 + 1] = bg[1];
      buf[i * 4 + 2] = bg[2];
      buf[i * 4 + 3] = bg[3];
    }
  }
  return { w, h, buf };
}

function setPx(c, x, y, color) {
  if (x < 0 || y < 0 || x >= c.w || y >= c.h) return;
  const i = (y * c.w + x) * 4;
  c.buf[i] = color[0];
  c.buf[i + 1] = color[1];
  c.buf[i + 2] = color[2];
  c.buf[i + 3] = color[3];
}

function inRoundRect(px, py, x, y, w, h, r) {
  if (px < x || py < y || px >= x + w || py >= y + h) return false;
  const rx = Math.min(r, w / 2);
  const ry = Math.min(r, h / 2);
  const cxL = x + rx;
  const cxR = x + w - rx;
  const cyT = y + ry;
  const cyB = y + h - ry;
  let cx = px;
  let cy = py;
  if (px < cxL) cx = cxL;
  else if (px > cxR) cx = cxR;
  if (py < cyT) cy = cyT;
  else if (py > cyB) cy = cyB;
  if (px < cxL || px > cxR || py < cyT || py > cyB) {
    const dx = px - cx;
    const dy = py - cy;
    return dx * dx + dy * dy <= rx * ry;
  }
  return true;
}

function roundRect(c, x, y, w, h, r, color) {
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(c.w, Math.ceil(x + w));
  const y1 = Math.min(c.h, Math.ceil(y + h));
  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      if (inRoundRect(px, py, x, y, w, h, r)) setPx(c, px, py, color);
    }
  }
}

/** Draw the plate motif filling a centered box of the given relative width. */
function drawPlate(c, relWidth) {
  const w = c.w;
  const h = c.h;
  const pw = w * relWidth;
  const ph = pw * 0.32; // plate-ish proportion for an icon
  const px = (w - pw) / 2;
  const py = (h - ph) / 2;
  const radius = ph * 0.16;
  const border = Math.max(3, ph * 0.07);

  // Black frame + yellow face
  roundRect(c, px, py, pw, ph, radius, BLACK);
  roundRect(c, px + border, py + border, pw - 2 * border, ph - 2 * border, radius * 0.8, YELLOW);

  const innerX = px + border;
  const innerY = py + border;
  const innerW = pw - 2 * border;
  const innerH = ph - 2 * border;
  const pad = innerH * 0.16;

  // Blue EU strip on the start side
  const stripW = innerW * 0.12;
  roundRect(c, innerX + pad, innerY + pad, stripW, innerH - 2 * pad, radius * 0.4, BLUE);
  // small white dots to suggest the IL band
  const dot = Math.max(2, stripW * 0.18);
  setPx; // noop ref
  roundRect(c, innerX + pad + stripW / 2 - dot / 2, innerY + innerH * 0.28, dot, dot, dot / 2, WHITE);
  roundRect(c, innerX + pad + stripW / 2 - dot / 2, innerY + innerH * 0.58, dot, dot, dot / 2, WHITE);

  // Black digit bars
  const barsX = innerX + pad * 2 + stripW;
  const barsW = innerW - (barsX - innerX) - pad;
  const nBars = 5;
  const gap = barsW * 0.06;
  const barW = (barsW - gap * (nBars - 1)) / nBars;
  const barH = innerH * 0.5;
  const barY = innerY + (innerH - barH) / 2;
  for (let i = 0; i < nBars; i++) {
    roundRect(c, barsX + i * (barW + gap), barY, barW, barH, barW * 0.25, BLACK);
  }
}

// ---- PNG encoding (RGBA, 8-bit) ----
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(c) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(c.w, 0);
  ihdr.writeUInt32BE(c.h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc((c.w * 4 + 1) * c.h);
  for (let y = 0; y < c.h; y++) {
    raw[y * (c.w * 4 + 1)] = 0; // filter: none
    for (let x = 0; x < c.w * 4; x++) {
      raw[y * (c.w * 4 + 1) + 1 + x] = c.buf[y * c.w * 4 + x];
    }
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function write(name, canvas) {
  const out = path.join(__dirname, '..', 'assets', name);
  fs.writeFileSync(out, encodePng(canvas));
  console.log('wrote', name, `${canvas.w}x${canvas.h}`);
}

// icon: dark background, yellow plate
const icon = createCanvas(1024, 1024, DARK);
drawPlate(icon, 0.78);
write('icon.png', icon);

// adaptive-icon foreground: transparent bg, plate in safe zone
const adaptive = createCanvas(1024, 1024, TRANSPARENT);
drawPlate(adaptive, 0.6);
write('adaptive-icon.png', adaptive);

// splash: transparent bg (backgroundColor set in app.json), centered plate
const splash = createCanvas(1024, 1024, TRANSPARENT);
drawPlate(splash, 0.62);
write('splash-icon.png', splash);

// favicon
const favicon = createCanvas(96, 96, DARK);
drawPlate(favicon, 0.86);
write('favicon.png', favicon);

console.log('Done. Assets generated in ./assets');

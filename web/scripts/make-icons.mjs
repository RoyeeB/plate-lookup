#!/usr/bin/env node
/**
 * Rasterises the app's Israeli-plate icon as PNGs, with zero extra
 * dependencies. The project intentionally ships no image/canvas library, so
 * this script paints pixels straight into an RGBA buffer and encodes them as
 * PNG chunks by hand, using only Node's built-in `zlib` (for the IDAT
 * deflate/zlib stream — the exact format a PNG chunk requires) and `fs`.
 *
 * Design: a yellow (#F4C400) plate field with a black (#111111) rounded
 * border and a blue (#0033A0) strip along the leading edge — the same motif
 * as public/favicon.svg, scaled to fill the icon. The background is solid
 * black and always painted edge-to-edge (no transparency), which is what
 * apple-touch-icon requires and also what keeps the maskable icon safe: the
 * plate motif itself is drawn inset by a padding fraction so nothing
 * meaningful sits in the zone a circular/squircle OS mask could crop.
 *
 * Three bold black digits sit in the yellow field, trailing the blue strip —
 * without them a yellow-and-blue square reads as an abstract shape, not a
 * licence plate. They're drawn as seven-segment glyphs (each segment a
 * filled rectangle) rather than real type, since that's unambiguous at
 * home-screen sizes and needs no font/rasteriser dependency.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const PLATE_YELLOW = [0xf4, 0xc4, 0x00];
const PLATE_BLACK = [0x11, 0x11, 0x11];
const PLATE_BLUE = [0x00, 0x33, 0xa0];

/** Point-in-rounded-rectangle test, sampled at pixel centres. */
function insideRoundedRect(px, py, x0, y0, x1, y1, radius) {
  if (px < x0 || px > x1 || py < y0 || py > y1) return false;
  const withinXCore = px >= x0 + radius && px <= x1 - radius;
  const withinYCore = py >= y0 + radius && py <= y1 - radius;
  if (withinXCore || withinYCore) return true;
  const cx = px < x0 + radius ? x0 + radius : x1 - radius;
  const cy = py < y0 + radius ? y0 + radius : y1 - radius;
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= radius * radius;
}

/** Fills an axis-aligned rectangle directly (used for the digit segments — no curves needed). */
function fillRect(buffer, size, x0, y0, x1, y1, color) {
  const xStart = Math.max(0, Math.round(x0));
  const xEnd = Math.min(size, Math.round(x1));
  const yStart = Math.max(0, Math.round(y0));
  const yEnd = Math.min(size, Math.round(y1));
  for (let y = yStart; y < yEnd; y += 1) {
    for (let x = xStart; x < xEnd; x += 1) {
      const idx = (y * size + x) * 4;
      buffer[idx] = color[0];
      buffer[idx + 1] = color[1];
      buffer[idx + 2] = color[2];
      buffer[idx + 3] = 255;
    }
  }
}

/**
 * Which of the 7 segments (a=top, b=upper-right, c=lower-right, d=bottom,
 * e=lower-left, f=upper-left, g=middle) are lit for each digit 0-9.
 */
const SEVEN_SEGMENT_DIGITS = {
  0: 'abcdef',
  1: 'bc',
  2: 'abged',
  3: 'abgcd',
  4: 'fgbc',
  5: 'afgcd',
  6: 'afgecd',
  7: 'abc',
  8: 'abcdefg',
  9: 'abcdfg',
};

/**
 * Draws one seven-segment digit inside the box (x0, y0)-(x0+w, y0+h), with
 * segment thickness `stroke`. Segments overlap slightly at the corners
 * on purpose (cheaper than mitring, and invisible once filled with a flat
 * colour).
 */
function drawDigit(buffer, size, digit, x0, y0, w, h, stroke, color) {
  const lit = SEVEN_SEGMENT_DIGITS[digit];
  const midY = y0 + h / 2;
  const segmentRects = {
    a: [x0 + stroke * 0.5, y0, x0 + w - stroke * 0.5, y0 + stroke],
    g: [x0 + stroke * 0.5, midY - stroke / 2, x0 + w - stroke * 0.5, midY + stroke / 2],
    d: [x0 + stroke * 0.5, y0 + h - stroke, x0 + w - stroke * 0.5, y0 + h],
    f: [x0, y0, x0 + stroke, midY + stroke / 2],
    b: [x0 + w - stroke, y0, x0 + w, midY + stroke / 2],
    e: [x0, midY - stroke / 2, x0 + stroke, y0 + h],
    c: [x0 + w - stroke, midY - stroke / 2, x0 + w, y0 + h],
  };
  for (const segment of lit) {
    const [rx0, ry0, rx1, ry1] = segmentRects[segment];
    fillRect(buffer, size, rx0, ry0, rx1, ry1, color);
  }
}

/**
 * Paints the plate motif into an RGBA buffer.
 * `padding` is the maskable safe-area fraction (0 for regular icons, 0.1 for
 * the maskable one) kept empty (background colour only) on every side.
 */
function paintIcon(buffer, size, padding) {
  const contentSize = size * (1 - padding * 2);
  const offset = size * padding;

  const margin = contentSize * 0.08; // gives the black rounded border its width
  const plateRadius = contentSize * 0.12;
  const plateX0 = offset + margin;
  const plateY0 = offset + margin;
  const plateX1 = offset + contentSize - margin;
  const plateY1 = offset + contentSize - margin;

  // Slightly slimmer than before: the digits need the room this frees up
  // on the trailing side of the plate.
  const stripPad = contentSize * 0.035;
  const stripWidth = contentSize * 0.12;
  const stripRadius = contentSize * 0.03;
  const stripX0 = plateX0 + stripPad;
  const stripX1 = stripX0 + stripWidth;
  const stripY0 = plateY0 + stripPad;
  const stripY1 = plateY1 - stripPad;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const px = x + 0.5;
      const py = y + 0.5;

      let color = PLATE_BLACK; // full-bleed opaque background
      if (insideRoundedRect(px, py, plateX0, plateY0, plateX1, plateY1, plateRadius)) {
        color = PLATE_YELLOW;
        if (insideRoundedRect(px, py, stripX0, stripY0, stripX1, stripY1, stripRadius)) {
          color = PLATE_BLUE;
        }
      }

      const idx = (y * size + x) * 4;
      buffer[idx] = color[0];
      buffer[idx + 1] = color[1];
      buffer[idx + 2] = color[2];
      buffer[idx + 3] = 255; // fully opaque everywhere
    }
  }

  // Three bold digits, trailing the blue strip, centred in the yellow field.
  // Glyph height is 45% of the field height (within the 45-50% target);
  // stroke is exactly 1/5 of glyph height so strokes stay solid once the
  // icon is scaled down to a ~48px home-screen size. Aspect (0.4) and the
  // inter-digit gap (0.6x stroke) are kept narrow so all three digits clear
  // the plate border and the blue strip with room to spare, even on the
  // maskable icon's smaller safe area.
  const plateHeight = plateY1 - plateY0;
  const glyphHeight = plateHeight * 0.45;
  const stroke = glyphHeight / 5;
  const glyphWidth = glyphHeight * 0.4;
  const digitGap = stroke * 0.6;

  const digits = [7, 4, 2];
  const totalWidth = digits.length * glyphWidth + (digits.length - 1) * digitGap;
  const marginFromStrip = contentSize * 0.025;
  const marginFromBorder = contentSize * 0.035;
  const availableX0 = stripX1 + marginFromStrip;
  const availableX1 = plateX1 - marginFromBorder;
  const startX = availableX0 + Math.max(0, (availableX1 - availableX0 - totalWidth) / 2);
  const startY = plateY0 + (plateHeight - glyphHeight) / 2;

  digits.forEach((digit, i) => {
    const x0 = startX + i * (glyphWidth + digitGap);
    drawDigit(buffer, size, digit, x0, startY, glyphWidth, glyphHeight, stroke, PLATE_BLACK);
  });
}

/** Standard PNG CRC-32, computed by hand (no dependency provides it). */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

/**
 * Encodes a square RGBA buffer as a minimal, uncompressed-filter PNG.
 * `dropAlpha` writes an RGB-only (color type 2) PNG instead — used for
 * apple-touch-icon, which iOS expects to be fully opaque with no alpha
 * channel at all (every source pixel here is already alpha=255, so this is
 * just a channel drop, not a visual change).
 */
function encodePNG(size, rgba, dropAlpha = false) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0); // width
  ihdrData.writeUInt32BE(size, 4); // height
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(dropAlpha ? 2 : 6, 9); // color type: RGB or RGBA
  ihdrData.writeUInt8(0, 10); // compression method
  ihdrData.writeUInt8(0, 11); // filter method
  ihdrData.writeUInt8(0, 12); // interlace method
  const ihdr = pngChunk('IHDR', ihdrData);

  // Each scanline is prefixed with a filter-type byte; 0 = "none".
  const channels = dropAlpha ? 3 : 4;
  const stride = size * channels;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < size; x += 1) {
      const srcIdx = (y * size + x) * 4;
      const dstIdx = rowStart + 1 + x * channels;
      raw[dstIdx] = rgba[srcIdx];
      raw[dstIdx + 1] = rgba[srcIdx + 1];
      raw[dstIdx + 2] = rgba[srcIdx + 2];
      if (!dropAlpha) raw[dstIdx + 3] = rgba[srcIdx + 3];
    }
  }
  const idat = pngChunk('IDAT', deflateSync(raw, { level: 9 }));

  const iend = pngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function makeIcon(size, padding = 0, dropAlpha = false) {
  const buffer = Buffer.alloc(size * size * 4);
  paintIcon(buffer, size, padding);
  return encodePNG(size, buffer, dropAlpha);
}

mkdirSync(join(publicDir, 'icons'), { recursive: true });

writeFileSync(join(publicDir, 'icons', 'icon-192.png'), makeIcon(192));
writeFileSync(join(publicDir, 'icons', 'icon-512.png'), makeIcon(512));
writeFileSync(join(publicDir, 'icons', 'icon-512-maskable.png'), makeIcon(512, 0.1));
writeFileSync(join(publicDir, 'apple-touch-icon.png'), makeIcon(180, 0, true));

console.log('Wrote icon-192.png, icon-512.png, icon-512-maskable.png, apple-touch-icon.png');

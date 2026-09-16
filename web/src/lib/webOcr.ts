/**
 * Browser OCR engine: Tesseract.js running in a Web Worker.
 *
 * Everything happens on-device — the frame is grabbed from the <video> into a
 * canvas and handed to the worker. No image ever leaves the browser.
 *
 * The worker is created lazily on first scan and kept alive for the session,
 * because spinning it up (downloading the trained-data file) costs a few
 * seconds and we don't want to pay that on every capture.
 *
 * A single shutter press is unreliable on its own — one blurry or glare-lit
 * frame can misread a digit — so `recognizePlateConsensus` captures several
 * frames in quick succession, gives each a plain and (if needed) an
 * inverted/binarized pass, and hands the resulting candidates to
 * `pickConsensus` (in `./ocr`, which stays DOM-free) to settle on one answer.
 */
import { createWorker, type Worker } from 'tesseract.js';
import { extractPlateFromResult, pickConsensus, type OcrTextResult } from './ocr';

let workerPromise: Promise<Worker> | null = null;

async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker('eng');
      await worker.setParameters({
        // Plates are digits and separators only — restricting the alphabet
        // sharply reduces letter/digit confusions.
        tessedit_char_whitelist: '0123456789-',
      });
      return worker;
    })().catch((err) => {
      workerPromise = null; // let the next attempt retry a failed download
      throw err;
    });
  }
  return workerPromise;
}

/** Warm the engine up (trained data download) without blocking the UI. */
export function preloadOcr(): void {
  void getWorker().catch(() => {
    /* surfaced on first real scan instead */
  });
}

export async function terminateOcr(): Promise<void> {
  const pending = workerPromise;
  workerPromise = null;
  if (!pending) return;
  try {
    const worker = await pending;
    await worker.terminate();
  } catch {
    // nothing to clean up
  }
}

/**
 * Grab the region of the video currently inside the on-screen guide box.
 *
 * `guide` is the guide rectangle in CSS pixels relative to the video element's
 * own box. The video is rendered with `object-fit: cover`, so we first work out
 * how the source frame maps onto that box, then invert it.
 */
export interface GuideRect {
  x: number;
  y: number;
  width: number;
  height: number;
  /** The video element's rendered size in CSS pixels. */
  displayWidth: number;
  displayHeight: number;
}

/** Upscale factor for the cropped plate — Tesseract wants tall-ish glyphs. */
const TARGET_CROP_WIDTH = 1000;

export function captureGuideFrame(
  video: HTMLVideoElement,
  guide: GuideRect
): HTMLCanvasElement | null {
  const srcW = video.videoWidth;
  const srcH = video.videoHeight;
  if (!srcW || !srcH || !guide.displayWidth || !guide.displayHeight) return null;

  // `object-fit: cover`: the frame is scaled up until it covers the box, then
  // centred and clipped — so the scale is the LARGER of the two ratios.
  const scale = Math.max(guide.displayWidth / srcW, guide.displayHeight / srcH);
  const offsetX = (srcW * scale - guide.displayWidth) / 2;
  const offsetY = (srcH * scale - guide.displayHeight) / 2;

  const sx = (guide.x + offsetX) / scale;
  const sy = (guide.y + offsetY) / scale;
  const sw = guide.width / scale;
  const sh = guide.height / scale;

  const ratio = Math.min(TARGET_CROP_WIDTH / sw, 4);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(sw * ratio);
  canvas.height = Math.round(sh * ratio);

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  toHighContrastGrayscale(ctx, canvas.width, canvas.height);
  return canvas;
}

/**
 * Grayscale + contrast stretch. Israeli plates are black on yellow, which is a
 * weak luminance contrast; pushing it apart materially improves recognition.
 */
function toHighContrastGrayscale(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const image = ctx.getImageData(0, 0, width, height);
  const { data } = image;

  let min = 255;
  let max = 0;
  const luma = new Uint8ClampedArray(width * height);

  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    const y = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) | 0;
    luma[p] = y;
    if (y < min) min = y;
    if (y > max) max = y;
  }

  const range = Math.max(1, max - min);
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    const stretched = ((luma[p] - min) * 255) / range;
    data[i] = stretched;
    data[i + 1] = stretched;
    data[i + 2] = stretched;
  }

  ctx.putImageData(image, 0, 0);
}

/** Run OCR over a canvas and return the best plate candidate, or null. */
async function recognizeCanvas(canvas: HTMLCanvasElement): Promise<string | null> {
  const worker = await getWorker();
  const { data } = await worker.recognize(canvas, {}, { text: true, blocks: true });

  const blocks = (data.blocks ?? []).map((b) => ({ text: b.text ?? '' }));
  const result: OcrTextResult = { text: data.text ?? '', blocks };
  return extractPlateFromResult(result);
}

/**
 * Invert + binarize an already contrast-stretched crop.
 *
 * `captureGuideFrame` produces a grayscale, contrast-stretched image where
 * plate digits are dark-on-light (black digits, yellow field lightened to
 * near-white). Tesseract's bundled model is trained mostly on dark text on a
 * light background, which this already matches — but on a washed-out or
 * glare-heavy capture that first pass sometimes reads as noise. Inverting to
 * light-on-dark and snapping every pixel to pure black/white gives the
 * engine a second, very different-looking shot at the same frame.
 */
function invertedVariant(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = canvas.width;
  out.height = canvas.height;

  const srcCtx = canvas.getContext('2d', { willReadFrequently: true });
  const outCtx = out.getContext('2d');
  if (!srcCtx || !outCtx) return out;

  const image = srcCtx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = image;
  for (let i = 0; i < data.length; i += 4) {
    // The source is already grayscale, so R/G/B are equal; inverting and
    // thresholding at the midpoint turns it into a clean binary mask.
    const inverted = 255 - data[i];
    const bw = inverted > 127 ? 255 : 0;
    data[i] = bw;
    data[i + 1] = bw;
    data[i + 2] = bw;
  }
  outCtx.putImageData(image, 0, 0);
  return out;
}

/**
 * Recognize one captured frame, falling back to the inverted/binarized
 * variant when the plain contrast-stretched crop yields no plate-shaped
 * digit run at all.
 */
async function recognizeFrame(canvas: HTMLCanvasElement): Promise<string | null> {
  const plain = await recognizeCanvas(canvas);
  if (plain) return plain;
  return recognizeCanvas(invertedVariant(canvas));
}

/** How many frames one shutter press captures, and the gap between them. */
const CONSENSUS_FRAME_COUNT = 3;
const CONSENSUS_FRAME_INTERVAL_MS = 150;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * One shutter press, several frames: capture `CONSENSUS_FRAME_COUNT` frames
 * spaced `CONSENSUS_FRAME_INTERVAL_MS` apart (letting focus/exposure settle
 * and averaging out a single bad frame — motion blur, glare, a finger
 * twitch), OCR each independently, then let `pickConsensus` decide.
 *
 * Throws only when the guide/video geometry itself is unusable (e.g. the
 * layout hasn't measured yet) — that is a real error, distinct from simply
 * not finding a plate, which resolves to `null` instead.
 */
export async function recognizePlateConsensus(
  video: HTMLVideoElement,
  guide: GuideRect
): Promise<string | null> {
  const candidates: string[] = [];
  let capturedAnyFrame = false;

  for (let i = 0; i < CONSENSUS_FRAME_COUNT; i += 1) {
    const canvas = captureGuideFrame(video, guide);
    if (canvas) {
      capturedAnyFrame = true;
      const plate = await recognizeFrame(canvas);
      if (plate) candidates.push(plate);
    }
    if (i < CONSENSUS_FRAME_COUNT - 1) await delay(CONSENSUS_FRAME_INTERVAL_MS);
  }

  if (!capturedAnyFrame) {
    throw new Error('Could not capture a video frame for the guide box');
  }

  return pickConsensus(candidates);
}

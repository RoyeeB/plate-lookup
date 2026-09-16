/**
 * Turns raw OCR engine output into a best-guess plate number.
 *
 * Engine-agnostic: it only needs a flat text blob plus per-block texts, which
 * is what both ML Kit (native) and Tesseract.js (web) produce.
 *
 * Strategy (per spec):
 *  1. Take every text block the engine returns.
 *  2. Apply character-confusion corrections (O→0, I/l→1, S→5, B→8, Z→2, …).
 *  3. Strip non-digits from each candidate.
 *  4. Pick the longest digit run of length 5-8.
 *  5. If nothing qualifies, return null — never guess.
 *
 * Also home to `pickConsensus`, which resolves multiple frames' worth of
 * candidates into one answer (see its own doc comment). Both stay free of
 * DOM/canvas APIs so they run the same way in a browser and in a plain Node
 * unit test.
 */
import { MAX_PLATE_DIGITS, MIN_PLATE_DIGITS } from './plate';

/** Minimal shape of one recognized text block. */
export interface OcrTextBlock {
  text: string;
}

export interface OcrTextResult {
  text: string;
  blocks: OcrTextBlock[];
}

/** Common OCR letter→digit confusions on plates. */
const CONFUSIONS: Readonly<Record<string, string>> = {
  O: '0',
  o: '0',
  Q: '0',
  D: '0',
  I: '1',
  l: '1',
  L: '1',
  '|': '1',
  S: '5',
  s: '5',
  B: '8',
  Z: '2',
  z: '2',
  G: '6',
  T: '7',
};

/** Replace confusable characters with their likely digit. */
export function applyConfusionCorrections(text: string): string {
  let out = '';
  for (const ch of text) {
    out += CONFUSIONS[ch] ?? ch;
  }
  return out;
}

/**
 * Given the block texts the engine produced, return the most plausible plate digit
 * string, or null if none is 5-8 digits long.
 */
export function extractPlateFromBlocks(blockTexts: string[]): string | null {
  const candidates: string[] = [];

  for (const raw of blockTexts) {
    // Split on whitespace so "12-345-67 XYZ" yields separate tokens, then also
    // consider the whole corrected block (handles dashes inside one token).
    const corrected = applyConfusionCorrections(raw);
    const tokens = corrected.split(/\s+/);
    for (const token of [corrected, ...tokens]) {
      const digits = token.replace(/\D+/g, '');
      if (
        digits.length >= MIN_PLATE_DIGITS &&
        digits.length <= MAX_PLATE_DIGITS
      ) {
        candidates.push(digits);
      }
    }
  }

  if (candidates.length === 0) return null;

  // Prefer the longest run; ties broken by first appearance (Map preserves it).
  candidates.sort((a, b) => b.length - a.length);
  return candidates[0] ?? null;
}

/** Convenience wrapper over an OCR result object. */
export function extractPlateFromResult(
  result: OcrTextResult | null | undefined
): string | null {
  if (!result) return null;
  const blockTexts = result.blocks.map((b) => b.text);
  // Also include the full flattened text as a fallback block.
  if (result.text) blockTexts.push(result.text);
  return extractPlateFromBlocks(blockTexts);
}

/**
 * Multi-frame consensus: given one plate-digit candidate per captured frame
 * (nulls/failed frames already filtered out by the caller), pick the value
 * the most frames agree on.
 *
 * A single frame that disagrees with the rest must never win over a
 * majority — that's the whole point of capturing more than one frame. Ties
 * are broken by whichever candidate was seen first, since the earliest frame
 * is captured right as the shutter is pressed, before any hand shake has a
 * chance to build up. Kept DOM-free and pure so it can be unit-tested in
 * Node without a browser or canvas.
 */
export function pickConsensus(candidates: string[]): string | null {
  const counts = new Map<string, number>();
  for (const candidate of candidates) {
    counts.set(candidate, (counts.get(candidate) ?? 0) + 1);
  }

  let best: string | null = null;
  let bestCount = 0;
  for (const candidate of candidates) {
    const count = counts.get(candidate) ?? 0;
    // Strictly greater, not >=, so the first candidate to reach a given
    // count keeps its lead — that's the earliest-wins tie-break.
    if (count > bestCount) {
      bestCount = count;
      best = candidate;
    }
  }
  return best;
}

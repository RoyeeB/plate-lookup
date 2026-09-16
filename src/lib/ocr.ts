/**
 * Turns raw ML Kit text-recognition output into a best-guess plate number.
 *
 * Strategy (per spec):
 *  1. Take every text block ML Kit returns.
 *  2. Apply character-confusion corrections (O→0, I/l→1, S→5, B→8, Z→2, …).
 *  3. Strip non-digits from each candidate.
 *  4. Pick the longest digit run of length 5-8.
 *  5. If nothing qualifies, return null — never guess.
 */
import { MAX_PLATE_DIGITS, MIN_PLATE_DIGITS } from './plate';

/** Minimal shape of a @react-native-ml-kit/text-recognition result block. */
export interface MlkitTextBlock {
  text: string;
}

export interface MlkitTextResult {
  text: string;
  blocks: MlkitTextBlock[];
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
 * Given the block texts ML Kit produced, return the most plausible plate digit
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

/** Convenience wrapper over the ML Kit result object. */
export function extractPlateFromResult(
  result: MlkitTextResult | null | undefined
): string | null {
  if (!result) return null;
  const blockTexts = result.blocks.map((b) => b.text);
  // Also include the full flattened text as a fallback block.
  if (result.text) blockTexts.push(result.text);
  return extractPlateFromBlocks(blockTexts);
}

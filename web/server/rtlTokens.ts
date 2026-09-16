/**
 * Word layout for right-to-left lines in the share image.
 *
 * Satori shapes Hebrew glyphs inside a word correctly but places words left to
 * right and drops the spaces where the direction changes. So the image lays
 * out words itself, in a row-reverse flex line. Consecutive Latin/number words
 * ("I10 2016") stay together as one token, keeping their own left-to-right
 * order — the same result a browser gives for an RTL paragraph.
 */
const HEBREW = /[֐-׿]/;
const LATIN_OR_DIGIT = /[A-Za-z0-9]/;

export function rtlTokens(text: string): string[] {
  const tokens: string[] = [];
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const previous = tokens[tokens.length - 1];
    const isLtr = !HEBREW.test(word) && LATIN_OR_DIGIT.test(word);
    const previousIsLtr =
      previous !== undefined && !HEBREW.test(previous) && LATIN_OR_DIGIT.test(previous);
    if (isLtr && previousIsLtr) tokens[tokens.length - 1] = `${previous} ${word}`;
    else tokens.push(word);
  }
  return tokens;
}

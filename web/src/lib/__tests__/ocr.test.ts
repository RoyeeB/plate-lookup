/**
 * Protects the OCR post-processing: the character-confusion table, the
 * "longest 5-8 digit run" candidate pick, and the multi-frame consensus vote.
 * Together these decide which number a scan puts in front of the user, so a
 * regression here means confidently showing the wrong plate.
 */
import { describe, expect, it } from 'vitest';
import {
  applyConfusionCorrections,
  extractPlateFromBlocks,
  extractPlateFromResult,
  pickConsensus,
} from '@/lib/ocr';

describe('applyConfusionCorrections', () => {
  it('maps the letters an engine mistakes for digits', () => {
    expect(applyConfusionCorrections('OIS')).toBe('015');
    expect(applyConfusionCorrections('BZGT')).toBe('8267');
    expect(applyConfusionCorrections('QD')).toBe('00');
  });

  it('handles both cases and the pipe glyph', () => {
    expect(applyConfusionCorrections('ol|L')).toBe('0111');
  });

  it('leaves real digits and separators untouched', () => {
    expect(applyConfusionCorrections('12-345-67')).toBe('12-345-67');
  });
});

describe('extractPlateFromBlocks', () => {
  it('reads a dashed plate as a digit string', () => {
    expect(extractPlateFromBlocks(['12-345-67'])).toBe('1234567');
  });

  it('ignores surrounding text on the plate', () => {
    // "IL" corrects to "11", which must not be glued onto the number.
    expect(extractPlateFromBlocks(['IL 12-345-67'])).toBe('1234567');
  });

  it('prefers the longest qualifying run', () => {
    expect(extractPlateFromBlocks(['12345', '1234567'])).toBe('1234567');
  });

  it('rejects runs outside the 5-8 digit window rather than guessing', () => {
    expect(extractPlateFromBlocks(['1234'])).toBeNull();
    expect(extractPlateFromBlocks(['123456789'])).toBeNull();
  });

  it('returns null when there is nothing numeric to work with', () => {
    expect(extractPlateFromBlocks(['ABC'])).toBeNull();
    expect(extractPlateFromBlocks([])).toBeNull();
  });
});

describe('extractPlateFromResult', () => {
  it('considers the flattened text as well as the blocks', () => {
    expect(
      extractPlateFromResult({ text: '12-345-67', blocks: [] })
    ).toBe('1234567');
  });

  it('returns null for a missing result', () => {
    expect(extractPlateFromResult(null)).toBeNull();
    expect(extractPlateFromResult(undefined)).toBeNull();
  });
});

describe('pickConsensus', () => {
  it('lets a majority outvote a single disagreeing frame', () => {
    // The whole point of capturing more than one frame: a blurred middle
    // frame must not decide the answer.
    expect(pickConsensus(['1234567', '7654321', '1234567'])).toBe('1234567');
  });

  it('breaks a tie towards the earliest frame', () => {
    // The first frame is grabbed as the shutter is pressed, before hand shake.
    expect(pickConsensus(['1111111', '2222222'])).toBe('1111111');
  });

  it('accepts a lone candidate — the user confirms it either way', () => {
    expect(pickConsensus(['1234567'])).toBe('1234567');
  });

  it('returns null when no frame produced anything', () => {
    expect(pickConsensus([])).toBeNull();
  });
});

// @vitest-environment jsdom
/**
 * The gauge is decoration for a sentence that is already on screen, but its
 * needle must still point at the right number and stay on the dial.
 */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { GAUGE_MAX_KM, MileageGauge, gaugeAngle } from '@/components/MileageGauge';

describe('gaugeAngle', () => {
  it('maps the dial from 0 km (-90°) to its top (+90°)', () => {
    expect(gaugeAngle(0)).toBe(-90);
    expect(gaugeAngle(GAUGE_MAX_KM / 2)).toBe(0);
    expect(gaugeAngle(GAUGE_MAX_KM)).toBe(90);
  });

  it('pins the needle instead of leaving the dial', () => {
    expect(gaugeAngle(80_000)).toBe(90);
    expect(gaugeAngle(-5)).toBe(-90);
  });
});

describe('MileageGauge', () => {
  it('is hidden from assistive tech, since the text beside it says the same', () => {
    const { container } = render(<MileageGauge perYear={15_000} band="average" />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });
});

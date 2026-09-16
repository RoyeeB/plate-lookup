// @vitest-environment jsdom
/**
 * The plate morph is progressive enhancement: navigation must happen whether
 * or not the browser supports View Transitions, and the temporary transition
 * name must never be left behind on the source element.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { navigateWithPlateMorph, shake } from '@/lib/motion';

type StartViewTransition = (cb: () => void) => { finished: Promise<void> };
const doc = document as unknown as { startViewTransition?: StartViewTransition };

afterEach(() => {
  delete doc.startViewTransition;
});

describe('navigateWithPlateMorph', () => {
  it('just navigates when the API is missing', () => {
    const navigate = vi.fn();
    navigateWithPlateMorph(document.createElement('div'), navigate);
    expect(navigate).toHaveBeenCalledOnce();
  });

  it('just navigates when there is no source element', () => {
    doc.startViewTransition = vi.fn();
    const navigate = vi.fn();
    navigateWithPlateMorph(null, navigate);
    expect(navigate).toHaveBeenCalledOnce();
    expect(doc.startViewTransition).not.toHaveBeenCalled();
  });

  it('names the source for the old snapshot only, then navigates', async () => {
    const source = document.createElement('div');
    let nameDuringSnapshot = '';
    let nameAfterUpdate = 'unset';
    doc.startViewTransition = (update) => {
      nameDuringSnapshot = source.style.getPropertyValue('view-transition-name');
      update();
      nameAfterUpdate = source.style.getPropertyValue('view-transition-name');
      return { finished: Promise.resolve() };
    };
    const navigate = vi.fn();

    navigateWithPlateMorph(source, navigate);
    await Promise.resolve();

    expect(nameDuringSnapshot).toBe('plate-hero');
    expect(nameAfterUpdate).toBe('');
    expect(navigate).toHaveBeenCalledOnce();
  });
});

describe('shake', () => {
  it('animates the element', () => {
    const element = document.createElement('div');
    const animate = vi.fn();
    element.animate = animate;
    shake(element);
    expect(animate).toHaveBeenCalledOnce();
  });

  it('stays still when reduced motion is requested', () => {
    const element = document.createElement('div');
    const animate = vi.fn();
    element.animate = animate;
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({ matches: query.includes('reduce') })) as typeof window.matchMedia;
    shake(element);
    window.matchMedia = original;
    expect(animate).not.toHaveBeenCalled();
  });

  it('ignores a missing element', () => {
    expect(() => shake(null)).not.toThrow();
  });
});

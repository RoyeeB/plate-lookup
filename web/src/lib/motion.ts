/**
 * Motion helpers. Every animation in the app is decoration, so each one checks
 * the user's reduced-motion preference and degrades to an instant change.
 */
import { flushSync } from 'react-dom';

export function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Must match `view-transition-name` on `.plate-badge--hero` in motion.css. */
const PLATE_TRANSITION_NAME = 'plate-hero';

/**
 * Runs a navigation inside a View Transition so the plate the user tapped
 * (the input field, or a badge in the recent list) morphs into the big badge at
 * the top of the vehicle screen.
 *
 * Only one element may carry a transition name at a time, so the name is put
 * on the source just for the "before" snapshot and taken off again before the
 * new screen renders. Browsers without the API just navigate.
 *
 * Relies on the router committing synchronously (BrowserRouter is mounted with
 * `useTransitions={false}`), otherwise flushSync can't capture the new screen.
 */
export function navigateWithPlateMorph(source: Element | null | undefined, navigate: () => void): void {
  if (
    !(source instanceof HTMLElement) ||
    typeof document.startViewTransition !== 'function' ||
    prefersReducedMotion()
  ) {
    navigate();
    return;
  }

  source.style.setProperty('view-transition-name', PLATE_TRANSITION_NAME);
  const transition = document.startViewTransition(() => {
    source.style.removeProperty('view-transition-name');
    flushSync(navigate);
  });
  // Covers a transition skipped before the callback ran (e.g. a hidden tab).
  void transition.finished.finally(() => source.style.removeProperty('view-transition-name'));
}

/**
 * A short horizontal shake — "that didn't work" for the plate field. Uses the
 * Web Animations API so it can replay on every attempt without remounting.
 */
export function shake(element: Element | null | undefined): void {
  if (!(element instanceof HTMLElement) || typeof element.animate !== 'function') return;
  if (prefersReducedMotion()) return;
  element.animate(
    [
      { translate: '0' },
      { translate: '-8px' },
      { translate: '7px' },
      { translate: '-5px' },
      { translate: '3px' },
      { translate: '0' },
    ],
    { duration: 380, easing: 'ease-out' }
  );
}

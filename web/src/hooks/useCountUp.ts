/**
 * Animates a number from 0 up to `target` once, with an ease-out curve.
 * Returns the target immediately when motion is reduced or unavailable, so the
 * final figure is never delayed for people who opted out of animation.
 */
import { useEffect, useState } from 'react';
import { prefersReducedMotion } from '@/lib/motion';

function canAnimate(): boolean {
  return typeof requestAnimationFrame === 'function' && !prefersReducedMotion();
}

export function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(() => (canAnimate() ? 0 : target));

  useEffect(() => {
    if (!canAnimate()) return;

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return canAnimate() ? value : target;
}

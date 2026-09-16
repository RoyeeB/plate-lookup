/**
 * Whether an element is currently on screen. Used to reveal the compact vehicle
 * bar once the big plate has scrolled away. Without IntersectionObserver it
 * reports "in view", so nothing that depends on it ever appears by mistake.
 */
import { useCallback, useEffect, useState } from 'react';

export function useInView<T extends Element>(rootMargin = '0px') {
  const [node, setNode] = useState<T | null>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    if (!node || typeof IntersectionObserver !== 'function') return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, rootMargin]);

  const ref = useCallback((element: T | null) => setNode(element), []);
  // A detached element (e.g. while the page shows a loading state) counts as
  // in view, so a stale "scrolled away" reading can't linger.
  return [ref, node ? inView : true] as const;
}

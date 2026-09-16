/**
 * Tracks browser connectivity. `navigator.onLine` is a coarse signal (it only
 * proves a link exists, not that the internet is reachable) — good enough to
 * show an offline state instead of a bare network error.
 */
import { useEffect, useState } from 'react';

export function useNetworkStatus(): { offline: boolean } {
  const [offline, setOffline] = useState(() => !navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return { offline };
}

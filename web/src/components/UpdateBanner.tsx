/**
 * "A new version is available" — shown when an updated service worker takes
 * over a page that was already running the old one. The page keeps working;
 * reloading just picks up the new code. Wired up in main.tsx.
 */
import { useEffect, useState } from 'react';
import { t } from '@/i18n';
import { Icon } from './Icon';

/** Dispatched on window by the service-worker registration. */
export const UPDATE_EVENT = 'plate-lookup:update-available';

export function UpdateBanner() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const onUpdate = () => setAvailable(true);
    window.addEventListener(UPDATE_EVENT, onUpdate);
    return () => window.removeEventListener(UPDATE_EVENT, onUpdate);
  }, []);

  if (!available) return null;

  return (
    <div className="update-banner" role="status">
      <Icon name="refresh" size={18} />
      <span className="update-banner__text">{t.update.available}</span>
      <button type="button" className="update-banner__action" onClick={() => window.location.reload()}>
        {t.update.reload}
      </button>
      <button
        type="button"
        className="update-banner__dismiss"
        onClick={() => setAvailable(false)}
        aria-label={t.update.dismiss}
      >
        <Icon name="close" size={18} />
      </button>
    </div>
  );
}

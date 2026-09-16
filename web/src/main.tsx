/// <reference types="vite/client" />
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { UPDATE_EVENT } from './components/UpdateBanner';
import { initMonitoring } from './lib/monitoring';
// Self-hosted fonts: no third-party request, and they keep working offline in
// the installed PWA. Only the Hebrew and Latin subsets, only the weights used.
import '@fontsource/ibm-plex-sans-hebrew/hebrew-400.css';
import '@fontsource/ibm-plex-sans-hebrew/hebrew-500.css';
import '@fontsource/ibm-plex-sans-hebrew/hebrew-600.css';
import '@fontsource/ibm-plex-sans-hebrew/hebrew-700.css';
import '@fontsource/ibm-plex-sans-hebrew/latin-400.css';
import '@fontsource/ibm-plex-sans-hebrew/latin-500.css';
import '@fontsource/ibm-plex-sans-hebrew/latin-600.css';
import '@fontsource/ibm-plex-sans-hebrew/latin-700.css';
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';

// No-op without VITE_SENTRY_DSN; never blocks rendering.
void initMonitoring().catch(() => {});

const container = document.getElementById('root');
if (!container) throw new Error('#root element is missing from index.html');

createRoot(container).render(
  <StrictMode>
    {/* Synchronous route commits: the plate morph (lib/motion.ts) snapshots the
        new screen right after navigating, which a transition would defer. */}
    <BrowserRouter useTransitions={false}>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// Register the offline app-shell worker in production builds only — during
// `vite dev` there's no built /sw.js, and a stale dev worker would just get
// in the way of hot reload. Registration failures are non-fatal: the app
// still works fully online without it.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  // The worker activates immediately (skipWaiting + clients.claim), so a
  // controller change on a page that already had one means new code landed.
  const hadController = navigator.serviceWorker.controller !== null;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) window.dispatchEvent(new Event(UPDATE_EVENT));
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // An installed PWA can stay open for days; look for updates when it
        // comes back to the foreground rather than only on a cold start.
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') void registration.update();
        });
      })
      .catch(() => {
        // Silent: offline support is a nice-to-have, not a hard requirement.
      });
  });
}

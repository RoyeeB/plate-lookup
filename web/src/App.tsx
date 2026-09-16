import { Suspense, lazy } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { t } from '@/i18n';
import { ToastProvider } from '@/hooks/useToast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Icon } from '@/components/Icon';
import HomePage from '@/pages/HomePage';
import VehiclePage from '@/pages/VehiclePage';
import '@/styles/app.css';

// The scan screen pulls in tesseract.js — keep it out of the initial bundle.
const ScanPage = lazy(() => import('@/pages/ScanPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // Retry behaviour is decided per-query in useVehicle, based on whether
      // the failure was "not found" or a transport error.
      retry: false,
    },
  },
});

/** Header title per route, mirroring the native Stack.Screen options. */
function useScreenTitle(): { title: string; showBack: boolean } {
  const { pathname } = useLocation();
  if (pathname.startsWith('/vehicle/')) {
    return { title: t.vehicle.officialTitle, showBack: true };
  }
  return { title: t.appName, showBack: false };
}

function Chrome() {
  const { title, showBack } = useScreenTitle();
  const { offline } = useNetworkStatus();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      {offline && <div className="offline-banner">{t.states.offlineTitle}</div>}
      <header className="app-header">
        {showBack && (
          <button
            type="button"
            className="app-header__back"
            onClick={() => navigate(-1)}
            aria-label={t.states.back}
          >
            <Icon name="chevron" size={24} flip />
          </button>
        )}
        <h1 className="app-header__title">{title}</h1>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/vehicle/:plate" element={<VehiclePage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const { pathname } = useLocation();

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        {pathname === '/scan' ? (
          <Suspense fallback={<div className="scan" />}>
            <Routes>
              <Route path="/scan" element={<ScanPage />} />
            </Routes>
          </Suspense>
        ) : (
          <Chrome />
        )}
      </ToastProvider>
    </QueryClientProvider>
  );
}

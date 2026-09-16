/**
 * Minimal toast: one message at a time, auto-dismissed. Used for the
 * "VIN copied" confirmation.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Icon } from '@/components/Icon';

interface ToastApi {
  show: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const DURATION_MS = 2200;
/** Matches the toast-out animation in app.css. */
const EXIT_MS = 180;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  // Kept mounted briefly after it times out, so it can animate away.
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback((next: string) => {
    window.clearTimeout(timer.current);
    setLeaving(false);
    setMessage(next);
    timer.current = window.setTimeout(() => {
      setLeaving(true);
      timer.current = window.setTimeout(() => {
        setMessage(null);
        setLeaving(false);
      }, EXIT_MS);
    }, DURATION_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const api = useMemo<ToastApi>(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {message !== null && (
        <div className="toast" role="status" aria-live="polite">
          <div className={`toast__body${leaving ? ' toast__body--leaving' : ''}`}>
            <span className="toast__icon" aria-hidden="true">
              <Icon name="check" size={16} />
            </span>
            {message}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

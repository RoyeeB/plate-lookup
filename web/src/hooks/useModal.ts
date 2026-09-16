/**
 * Modal dialog behaviour shared by the bottom sheets: Escape closes, Tab stays
 * inside, and focus returns to whatever opened the dialog when it unmounts.
 * Call it from the component that is mounted only while the dialog is open.
 */
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

const FOCUSABLE =
  'button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])';

export function useModal<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T>(null);

  // Captured during the first render: by the time any effect runs, autoFocus
  // has already moved focus into the dialog.
  const [opener] = useState(() => document.activeElement);
  useEffect(
    () => () => {
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    },
    [opener]
  );

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  /** Keep Tab cycling inside the dialog, as aria-modal promises. */
  const trapFocus = (e: KeyboardEvent<T>) => {
    if (e.key !== 'Tab' || !ref.current) return;
    const focusable = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return { ref, onKeyDown: trapFocus };
}

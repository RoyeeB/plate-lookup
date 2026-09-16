/**
 * Bottom sheet that shows the OCR-detected digits in an editable plate field.
 * The user must confirm — we never search automatically after a scan.
 */
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { t } from '@/i18n';
import { isValidPlate } from '@/lib/plate';
import { PlateInput } from './PlateInput';
import { Button } from './Button';

interface ConfirmSheetProps {
  open: boolean;
  initialPlate: string;
  onConfirm: (plate: string) => void;
  onCancel: () => void;
}

export function ConfirmSheet({ open, initialPlate, onConfirm, onCancel }: ConfirmSheetProps) {
  if (!open) return null;
  // Remounting per detection seeds the editable field from the new digits,
  // without an effect that copies props into state after the first render.
  return (
    <ConfirmDialog
      key={initialPlate}
      initialPlate={initialPlate}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

const FOCUSABLE = 'button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])';

function ConfirmDialog({ initialPlate, onConfirm, onCancel }: Omit<ConfirmSheetProps, 'open'>) {
  const [plate, setPlate] = useState(initialPlate);
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const errorId = useId();

  // Hand focus back to whatever opened the sheet (the capture button) on close.
  // Captured during the first render: by the time any effect runs, autoFocus
  // has already moved focus into the sheet.
  const [opener] = useState(() => document.activeElement);
  useEffect(
    () => () => {
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    },
    [opener]
  );

  // Escape closes the sheet, matching the native modal's back-button behaviour.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  /** Keep Tab cycling inside the sheet, as aria-modal promises. */
  const trapFocus = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !sheetRef.current) return;
    const focusable = Array.from(sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
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

  const valid = isValidPlate(plate);
  const showError = !valid && plate.length > 0;

  return (
    <div
      className="sheet-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={sheetRef}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={trapFocus}
      >
        <div className="sheet__handle" aria-hidden="true" />
        <h2 id={titleId} className="sheet__title">
          {t.scan.confirmTitle}
        </h2>
        <p className="sheet__subtitle">{t.scan.confirmSubtitle}</p>

        <PlateInput
          value={plate}
          onChange={setPlate}
          onSubmit={() => valid && onConfirm(plate)}
          invalid={showError}
          describedBy={showError ? errorId : undefined}
          autoFocus
        />

        {showError && (
          <p id={errorId} className="form-error form-error--center" role="alert">
            {t.home.invalidPlate}
          </p>
        )}

        <div className="sheet__actions">
          <Button
            label={t.scan.confirmSearch}
            icon="search"
            onClick={() => onConfirm(plate)}
            disabled={!valid}
          />
          <Button label={t.scan.confirmCancel} variant="ghost" onClick={onCancel} />
        </div>
      </div>
    </div>
  );
}

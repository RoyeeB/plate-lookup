/**
 * Bottom sheet that shows the OCR-detected digits in an editable plate field.
 * The user must confirm — we never search automatically after a scan.
 */
import { useEffect, useState } from 'react';
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
  const [plate, setPlate] = useState(initialPlate);

  // Sync when a new detection opens the sheet.
  useEffect(() => {
    if (open) setPlate(initialPlate);
  }, [open, initialPlate]);

  // Escape closes the sheet, matching the native modal's back-button behaviour.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const valid = isValidPlate(plate);

  return (
    <div
      className="sheet-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={t.scan.confirmTitle}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="sheet">
        <div className="sheet__handle" />
        <h2 className="sheet__title">{t.scan.confirmTitle}</h2>
        <p className="sheet__subtitle">{t.scan.confirmSubtitle}</p>

        <PlateInput value={plate} onChange={setPlate} onSubmit={() => valid && onConfirm(plate)} autoFocus />

        {!valid && plate.length > 0 && (
          <p className="form-error" style={{ textAlign: 'center' }}>
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

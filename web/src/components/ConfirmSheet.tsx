/**
 * Bottom sheet that shows the OCR-detected digits in an editable plate field.
 * The user must confirm — we never search automatically after a scan.
 */
import { useId, useState } from 'react';
import { t } from '@/i18n';
import { isValidPlate } from '@/lib/plate';
import { PlateInput } from './PlateInput';
import { Button } from './Button';
import { useModal } from '@/hooks/useModal';

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

function ConfirmDialog({ initialPlate, onConfirm, onCancel }: Omit<ConfirmSheetProps, 'open'>) {
  const [plate, setPlate] = useState(initialPlate);
  const { ref: sheetRef, onKeyDown: trapFocus } = useModal<HTMLDivElement>(onCancel);
  const titleId = useId();
  const errorId = useId();

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

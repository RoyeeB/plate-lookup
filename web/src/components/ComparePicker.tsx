/**
 * Bottom sheet for choosing the second car to compare against: one of the
 * recent searches, or any plate typed in.
 */
import { useId, useState } from 'react';
import { t } from '@/i18n';
import { isValidPlate, normalizePlate } from '@/lib/plate';
import { describeRecentSearch, type RecentSearch } from '@/lib/recentSearches';
import { useModal } from '@/hooks/useModal';
import { PlateInput } from './PlateInput';
import { PlateBadge } from './PlateBadge';
import { Button } from './Button';

interface ComparePickerProps {
  open: boolean;
  /** The car being compared from — left out of the suggestions. */
  currentPlate: string;
  recent: RecentSearch[];
  onPick: (plate: string) => void;
  onClose: () => void;
}

export function ComparePicker(props: ComparePickerProps) {
  if (!props.open) return null;
  return <PickerDialog {...props} />;
}

function PickerDialog({ currentPlate, recent, onPick, onClose }: ComparePickerProps) {
  const [plate, setPlate] = useState('');
  const { ref: sheetRef, onKeyDown: trapFocus } = useModal<HTMLDivElement>(onClose);
  const titleId = useId();
  const others = recent.filter((entry) => entry.plate !== currentPlate);
  const normalized = normalizePlate(plate);
  const valid = isValidPlate(normalized) && normalized !== currentPlate;

  return (
    <div
      className="sheet-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
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
          {t.compare.pickTitle}
        </h2>
        <p className="sheet__subtitle">{t.compare.pickSubtitle}</p>

        {others.length > 0 && (
          <ul className="compare-picker__list" aria-label={t.home.recentTitle}>
            {others.map((entry) => (
              <li key={entry.plate}>
                <button
                  type="button"
                  className="compare-picker__option"
                  onClick={() => onPick(entry.plate)}
                >
                  <PlateBadge plate={entry.plate} size="sm" />
                  <span className="compare-picker__desc">{describeRecentSearch(entry)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <PlateInput
          value={plate}
          onChange={setPlate}
          onSubmit={() => valid && onPick(normalized)}
          placeholder={t.home.platePlaceholder}
          valid={valid}
          autoFocus={others.length === 0}
        />

        <div className="sheet__actions">
          <Button
            label={t.compare.pickConfirm}
            icon="compare"
            onClick={() => onPick(normalized)}
            disabled={!valid}
          />
          <Button label={t.scan.confirmCancel} variant="ghost" onClick={onClose} />
        </div>
      </div>
    </div>
  );
}

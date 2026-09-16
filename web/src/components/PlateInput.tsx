/**
 * Large Israeli-plate-styled numeric input: black digits on yellow with a
 * rounded border and the blue EU strip. Digits are LTR & centered even in RTL.
 */
import { useId, type ChangeEvent, type KeyboardEvent } from 'react';
import { t } from '@/i18n';
import { MAX_PLATE_DIGITS } from '@/lib/plate';
import { Icon } from './Icon';

interface PlateInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  /** Shows the "complete number" check. Visual only — nothing is announced. */
  valid?: boolean;
  /** Marks the field invalid for assistive tech; pair with `describedBy`. */
  invalid?: boolean;
  /** Id of the element explaining the current error, if any. */
  describedBy?: string;
}

export function PlateInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  autoFocus,
  valid = false,
  invalid = false,
  describedBy,
}: PlateInputProps) {
  const id = useId();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Keep only digits, cap at max length.
    onChange(e.target.value.replace(/\D+/g, '').slice(0, MAX_PLATE_DIGITS));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSubmit?.();
  };

  return (
    <div className={`plate-field${valid ? ' plate-field--valid' : ''}`}>
      <span className="plate-field__strip" aria-hidden="true">
        IL
      </span>
      <input
        id={id}
        className="plate-field__input"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        enterKeyHint="search"
        maxLength={MAX_PLATE_DIGITS}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={t.home.plateInputLabel}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        autoFocus={autoFocus}
      />
      <span className="plate-field__check" aria-hidden="true">
        <Icon name="check" size={16} />
      </span>
    </div>
  );
}

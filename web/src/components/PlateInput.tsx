/**
 * Large Israeli-plate-styled numeric input: black digits on yellow with a
 * rounded border and the blue EU strip. Digits are LTR & centered even in RTL.
 */
import { useId, type ChangeEvent, type KeyboardEvent } from 'react';
import { MAX_PLATE_DIGITS } from '@/lib/plate';

interface PlateInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function PlateInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  autoFocus,
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
    <div className="plate-field">
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
        aria-label="שדה הזנת מספר לוחית"
        autoFocus={autoFocus}
      />
    </div>
  );
}

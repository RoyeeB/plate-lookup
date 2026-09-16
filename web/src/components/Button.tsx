/**
 * Buttons with large tap targets for one-handed use. `variant` controls look;
 * `icon` is an optional glyph shown before the label.
 */
import type { ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'plate' | 'secondary' | 'ghost';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  label: string;
  variant?: Variant;
  icon?: IconName;
  loading?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      className={`btn btn--${variant}`}
      disabled={isDisabled}
      aria-label={label}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span className="spinner" aria-hidden="true" />
      ) : (
        <>
          {icon && <Icon name={icon} size={22} />}
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

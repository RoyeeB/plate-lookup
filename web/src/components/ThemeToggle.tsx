/**
 * Header button cycling the colour theme: system → light → dark. Its label
 * names the current state and what a press does, since the icon alone is
 * ambiguous.
 */
import { t } from '@/i18n';
import { useTheme } from '@/hooks/useTheme';
import type { ThemeChoice } from '@/lib/theme';
import { Icon, type IconName } from './Icon';

const ICON: Record<ThemeChoice, IconName> = { system: 'monitor', light: 'sun', dark: 'moon' };

export function ThemeToggle() {
  const { choice, cycle } = useTheme();
  const label = t.theme.label.replace('{current}', t.theme[choice]);

  return (
    <button
      type="button"
      className="app-header__icon-button theme-toggle"
      onClick={cycle}
      aria-label={label}
      title={label}
    >
      {/* Keyed so the icon swap animates. */}
      <span className="theme-toggle__icon" key={choice}>
        <Icon name={ICON[choice]} size={22} />
      </span>
    </button>
  );
}

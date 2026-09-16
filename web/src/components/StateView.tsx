/**
 * Generic centered state screen (icon + title + body + optional actions).
 * Reused for not-found, network-error, offline, and permission-denied states.
 */
import { Button } from './Button';
import { Icon, type IconName } from './Icon';

interface Action {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'plate' | 'secondary' | 'ghost';
  icon?: IconName;
}

interface StateViewProps {
  icon: IconName;
  iconColor?: string;
  title: string;
  body: string;
  actions?: Action[];
}

export function StateView({ icon, iconColor, title, body, actions = [] }: StateViewProps) {
  return (
    <div className="state-view">
      <Icon name={icon} size={56} color={iconColor ?? 'var(--text-secondary)'} />
      <h2 className="state-view__title">{title}</h2>
      <p className="state-view__body">{body}</p>
      {actions.length > 0 && (
        <div className="state-view__actions">
          {actions.map((action) => (
            <Button
              key={action.label}
              label={action.label}
              icon={action.icon}
              variant={action.variant}
              onClick={action.onClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

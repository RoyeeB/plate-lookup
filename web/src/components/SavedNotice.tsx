/**
 * Shown above a vehicle page rendered from the offline copy. It leads with the
 * date, because saved data can be out of date in ways that matter — a licence
 * that has since expired, a car that has since been sold.
 */
import { t } from '@/i18n';
import { Icon } from './Icon';

interface SavedNoticeProps {
  savedAt: number;
  offline: boolean;
  onRetry: () => void;
  retrying: boolean;
}

function formatSavedAt(savedAt: number): string {
  return new Intl.DateTimeFormat('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(savedAt);
}

export function SavedNotice({ savedAt, offline, onRetry, retrying }: SavedNoticeProps) {
  return (
    <div className="saved-notice" role="status">
      <Icon name="cloud-offline" size={20} />
      <div className="saved-notice__text">
        <strong className="saved-notice__title">
          {t.saved.title.replace('{date}', formatSavedAt(savedAt))}
        </strong>
        <span>{offline ? t.saved.bodyOffline : t.saved.bodyError}</span>
      </div>
      {!offline && (
        <button
          type="button"
          className="saved-notice__retry"
          onClick={onRetry}
          disabled={retrying}
          aria-busy={retrying || undefined}
        >
          {retrying ? t.states.retrying : t.states.retry}
        </button>
      )}
    </div>
  );
}

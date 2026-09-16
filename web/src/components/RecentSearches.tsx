/**
 * "חיפושים אחרונים" list. Each row shows a plate badge and re-runs the search
 * on click. Includes a clear-history action.
 */
import { t } from '@/i18n';
import { formatPlate } from '@/lib/plate';
import { Icon } from './Icon';
import { PlateBadge } from './PlateBadge';

interface RecentSearchesProps {
  plates: string[];
  onSelect: (plate: string) => void;
  onClear: () => void;
}

export function RecentSearches({ plates, onSelect, onClear }: RecentSearchesProps) {
  return (
    <section className="recent">
      <div className="recent__header">
        <h2 className="recent__title">{t.home.recentTitle}</h2>
        {plates.length > 0 && (
          <button type="button" className="recent__clear" onClick={onClear}>
            {t.home.clearRecent}
          </button>
        )}
      </div>

      {plates.length === 0 ? (
        <p className="recent__empty">{t.home.recentEmpty}</p>
      ) : (
        <ul className="recent__list">
          {plates.map((plate) => (
            <li key={plate}>
              <button
                type="button"
                className="recent__row"
                onClick={() => onSelect(plate)}
                aria-label={`חפש שוב לוחית ${formatPlate(plate)}`}
              >
                <PlateBadge plate={plate} size="sm" />
                <Icon name="chevron" size={20} color="var(--text-secondary)" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

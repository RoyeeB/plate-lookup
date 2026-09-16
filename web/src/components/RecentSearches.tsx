/**
 * "חיפושים אחרונים" list. Each row shows a plate badge, what the car is, and
 * re-runs the search on click. The description matters: a list of bare seven
 * digit numbers is unreadable a day later, which is what this list used to be.
 */
import { t } from '@/i18n';
import { formatPlate } from '@/lib/plate';
import { describeRecentSearch, type RecentSearch } from '@/lib/recentSearches';
import { Icon } from './Icon';
import { PlateBadge } from './PlateBadge';

interface RecentSearchesProps {
  items: RecentSearch[];
  /** `source` is the row's plate badge, for the morph into the result screen. */
  onSelect: (plate: string, source: Element | null) => void;
  onClear: () => void;
}

export function RecentSearches({ items, onSelect, onClear }: RecentSearchesProps) {
  return (
    <section className="recent">
      <div className="recent__header">
        <h2 className="recent__title">{t.home.recentTitle}</h2>
        {items.length > 0 && (
          <button type="button" className="recent__clear" onClick={onClear}>
            {t.home.clearRecent}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="recent__empty">
          <span className="recent__empty-icon" aria-hidden="true">
            <Icon name="car" size={28} color="var(--text-secondary)" />
          </span>
          <p className="recent__empty-title">{t.home.recentEmptyTitle}</p>
          <p className="recent__empty-body">{t.home.recentEmpty}</p>
        </div>
      ) : (
        <ul className="recent__list">
          {items.map((entry) => {
            const description = describeRecentSearch(entry);
            return (
              <li key={entry.plate}>
                <button
                  type="button"
                  className="recent__row"
                  onClick={(e) =>
                    onSelect(entry.plate, e.currentTarget.querySelector('.plate-badge'))
                  }
                  aria-label={
                    description
                      ? t.home.searchAgainCar
                          .replace('{car}', description)
                          .replace('{plate}', formatPlate(entry.plate))
                      : t.home.searchAgainPlate.replace('{plate}', formatPlate(entry.plate))
                  }
                >
                  <span className="recent__text">
                    <PlateBadge plate={entry.plate} size="sm" />
                    {description && <span className="recent__desc">{description}</span>}
                  </span>
                  <Icon name="chevron" size={20} color="var(--text-secondary)" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

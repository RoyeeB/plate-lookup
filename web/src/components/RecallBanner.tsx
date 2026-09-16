/**
 * Outstanding manufacturer safety recall. This is the one thing on the screen a
 * driver may need to act on, so it sits above the spec cards and is styled as a
 * warning rather than as data.
 */
import { t } from '@/i18n';
import type { RecallRaw } from '@/api/types';
import { Icon } from './Icon';

interface RecallBannerProps {
  recalls: RecallRaw[];
}

function formatDate(value: unknown): string | null {
  const match = String(value ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const [, y, m, d] = match;
  return `${d}/${m}/${y}`;
}

export function RecallBanner({ recalls }: RecallBannerProps) {
  if (recalls.length === 0) return null;

  return (
    <section className="recall" role="alert">
      <div className="recall__head">
        <Icon name="warning" size={22} />
        <h2 className="recall__title">
          {t.recall.title}
          {recalls.length > 1 ? ` (${recalls.length})` : ''}
        </h2>
      </div>
      <p className="recall__body">{t.recall.body}</p>

      <ul className="recall__list">
        {recalls.map((recall, index) => {
          const opened = formatDate(recall.TAARICH_PTICHA);
          return (
            <li key={String(recall.RECALL_ID ?? index)} className="recall__item">
              {recall.SUG_TAKALA && (
                <strong className="recall__kind">{String(recall.SUG_TAKALA)}</strong>
              )}
              {recall.TEUR_TAKALA && <p className="recall__desc">{String(recall.TEUR_TAKALA)}</p>}
              {opened && (
                <span className="recall__date">
                  {t.recall.opened}: {opened}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

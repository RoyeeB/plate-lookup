/**
 * "יד ראשונה / שנייה / שלישית" — how many hands the car has passed through.
 *
 * Two honesty rules are baked in, because getting this wrong misleads a buyer:
 *  - Transfers through a dealer are shown but not counted as a hand, which is
 *    the Israeli convention.
 *  - The Ministry's transfer log only starts in January 2017. For an older car
 *    the number is a floor, and with no rows at all the answer is "unknown" —
 *    never "first owner".
 */
import { t } from '@/i18n';
import type { OwnershipInfo } from '@/api/specMapper';
import { Icon } from './Icon';

interface OwnershipCardProps {
  ownership: OwnershipInfo | null;
  /** True once the enrichment resolved, so we can distinguish "no data" from "loading". */
  loaded: boolean;
}

export function OwnershipCard({ ownership, loaded }: OwnershipCardProps) {
  if (!loaded) return null;

  if (!ownership) {
    return (
      <section className="ownership ownership--unknown">
        <div className="ownership__head">
          <Icon name="help-circle" size={20} color="var(--text-secondary)" />
          <h2 className="ownership__title">{t.ownership.unknownTitle}</h2>
        </div>
        <p className="ownership__note">{t.ownership.unknownBody}</p>
      </section>
    );
  }

  return (
    <section className="ownership">
      <h2 className="ownership__title">{t.ownership.title}</h2>

      <div className="ownership__headline">
        {ownership.isMinimum && (
          <span className="ownership__qualifier">{t.ownership.atLeast}</span>
        )}
        <span className="ownership__hand">{ownership.handLabel}</span>
      </div>

      <div className="ownership__stats">
        <span>
          {ownership.owners} {t.ownership.owners}
        </span>
        {ownership.dealerTransfers > 0 && (
          <span>
            {ownership.dealerTransfers} {t.ownership.dealerTransfers}
          </span>
        )}
      </div>

      <ol className="ownership__chain" aria-label={t.ownership.chainTitle}>
        {ownership.chain.map((link) => (
          <li
            key={link.key}
            className={`ownership__link${link.isDealer ? ' ownership__link--dealer' : ''}`}
          >
            <span className="ownership__dot" aria-hidden="true" />
            <span className="ownership__type">{link.type}</span>
            <span className="ownership__date">{link.date}</span>
          </li>
        ))}
      </ol>

      <p className="ownership__note">
        {t.ownership.dealerNote}
        {ownership.isMinimum ? ` ${t.ownership.partialNote}` : ''}
      </p>
    </section>
  );
}

/**
 * List price of the model when it was new. Deliberately NOT presented as a
 * valuation — a 2016 car's 2016 sticker price says little about what it is
 * worth today, and the disclaimer says so.
 */
import { t } from '@/i18n';
import type { PriceInfo } from '@/api/specMapper';

interface PriceCardProps {
  price: PriceInfo | null;
}

export function PriceCard({ price }: PriceCardProps) {
  if (!price) return null;

  return (
    <section className="price-card">
      <div className="price-card__head">
        <span className="price-card__label">
          {t.price.label}
          {price.year ? ` (${price.year})` : ''}
        </span>
        <span className="price-card__amount">{price.amount}</span>
      </div>

      {price.importer && (
        <div className="price-card__importer">
          <span>{t.price.importer}</span>
          <strong>{price.importer}</strong>
        </div>
      )}

      <p className="price-card__disclaimer">{t.price.disclaimer}</p>
    </section>
  );
}

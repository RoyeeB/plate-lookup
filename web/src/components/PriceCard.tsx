/**
 * List price of the model when it was new. Deliberately NOT presented as a
 * valuation — a 2016 car's 2016 sticker price says little about what it is
 * worth today, and the disclaimer says so.
 *
 * When the price list carries several trims of this model at different prices,
 * the card shows the range: the list can't say which trim this car is, so
 * choosing one figure would state a guess as fact.
 */
import { t } from '@/i18n';
import { formatCurrency, type PriceInfo } from '@/api/specMapper';
import { useCountUp } from '@/hooks/useCountUp';

interface PriceCardProps {
  price: PriceInfo | null;
}

export function PriceCard({ price }: PriceCardProps) {
  if (!price) return null;
  return <PriceCardContent price={price} />;
}

function PriceCardContent({ price }: { price: PriceInfo }) {
  const shownMin = useCountUp(price.value);
  const shownMax = useCountUp(price.maxValue ?? 0);
  const isRange = price.maxValue !== null && price.maxAmount !== null;
  const finalText = isRange ? `${price.amount} – ${price.maxAmount}` : price.amount;

  return (
    <section className="price-card">
      <div className="price-card__head">
        <span className="price-card__label">
          {t.price.label}
          {price.year ? ` (${price.year})` : ''}
        </span>
        {/* The ticking figure is decoration; assistive tech gets the final one. */}
        <span
          className={`price-card__amount${isRange ? ' price-card__amount--range' : ''}`}
          aria-hidden="true"
        >
          {formatCurrency(shownMin)}
          {isRange && (
            <>
              <span className="price-card__dash"> – </span>
              {formatCurrency(shownMax)}
            </>
          )}
        </span>
        <span className="visually-hidden">{finalText}</span>
        {isRange && <span className="price-card__range-note">{t.price.rangeNote}</span>}
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

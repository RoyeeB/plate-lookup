// @vitest-environment jsdom
/**
 * The price counts up visually, but assistive tech must get the real figure
 * straight away rather than a string of intermediate numbers.
 */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { PriceCard } from '@/components/PriceCard';
import { formatCurrency } from '@/api/specMapper';
import { t } from '@/i18n';

describe('PriceCard', () => {
  it('renders nothing without a price', () => {
    const { container } = render(<PriceCard price={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('exposes the final amount to assistive tech and hides the ticker', () => {
    const amount = formatCurrency(59_900);
    const { container } = render(
      <PriceCard
        price={{ value: 59_900, amount, maxValue: null, maxAmount: null, importer: null, year: '2016' }}
      />
    );
    // Compared as raw text: the he-IL currency format carries RTL marks that
    // Testing Library's text normaliser would otherwise mangle.
    expect(container.querySelector('.price-card .visually-hidden')?.textContent).toBe(amount);
    expect(container.querySelector('.price-card__amount')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('shows a range, with its explanation, when trims were priced differently', () => {
    const min = formatCurrency(242_900);
    const max = formatCurrency(286_900);
    const { container, getByText } = render(
      <PriceCard
        price={{ value: 242_900, amount: min, maxValue: 286_900, maxAmount: max, importer: null, year: '2019' }}
      />
    );
    expect(container.querySelector('.price-card .visually-hidden')?.textContent).toBe(`${min} – ${max}`);
    expect(getByText(t.price.rangeNote)).toBeTruthy();
    expect(container.querySelector('.price-card__importer')).toBeNull();
  });
});

/**
 * Equipment and driver-assist systems the model ships with, as chips. Only
 * features actually present are listed — an absent system is simply not shown,
 * because the catalogue's "0" often means "unknown" rather than "not fitted".
 */
import { t } from '@/i18n';
import type { Feature } from '@/api/specMapper';
import { Icon } from './Icon';

interface FeatureChipsProps {
  features: Feature[];
}

export function FeatureChips({ features }: FeatureChipsProps) {
  if (features.length === 0) return null;

  return (
    <section className="features">
      <h2 className="features__title">{t.features.title}</h2>
      <p className="features__subtitle">{t.features.subtitle}</p>
      <ul className="features__list">
        {features.map((feature) => (
          <li key={feature.key} className="features__chip">
            <Icon name="check" size={14} />
            <span>{feature.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

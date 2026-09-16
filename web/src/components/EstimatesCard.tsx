/**
 * "נתונים משוערים" — estimated specs card. Visually distinct (muted indigo
 * background, info icon, disclaimer) so it never reads as official registry data.
 */
import { t } from '@/i18n';
import type { EstimatedSpec } from '@/api/types';
import { Icon } from './Icon';

interface EstimatesCardProps {
  specs: EstimatedSpec[];
}

export function EstimatesCard({ specs }: EstimatesCardProps) {
  if (specs.length === 0) return null;

  return (
    <section className="estimates">
      <div className="estimates__header">
        <Icon name="info-circle" size={20} />
        <h2 className="estimates__title">{t.vehicle.estimatedTitle}</h2>
      </div>
      <p className="estimates__disclaimer">{t.vehicle.estimatedDisclaimer}</p>

      <div className="estimates__grid">
        {specs.map((spec) => (
          <div key={spec.key} className="estimates__cell">
            <div className="estimates__value">{spec.value}</div>
            <div className="estimates__label">{spec.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

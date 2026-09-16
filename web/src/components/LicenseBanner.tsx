/**
 * Licence validity banner. An expired test is the one thing on this screen that
 * has legal and financial consequences today, so it is styled as an alert and
 * sits at the top rather than as row twelve of the official field list (where
 * it also still appears, as the raw date).
 */
import { t } from '@/i18n';
import type { LicenseState, LicenseStatus } from '@/lib/licenseStatus';
import { Icon, type IconName } from './Icon';

interface LicenseBannerProps {
  status: LicenseStatus | null;
}

const COPY: Record<
  LicenseState,
  { icon: IconName; title: string; body: string }
> = {
  expired: {
    icon: 'warning',
    title: t.license.expiredTitle,
    body: t.license.expiredBody,
  },
  soon: {
    icon: 'alert-circle',
    title: t.license.soonTitle,
    body: t.license.soonBody,
  },
  valid: {
    icon: 'calendar',
    title: t.license.validTitle,
    body: t.license.validBody,
  },
};

export function LicenseBanner({ status }: LicenseBannerProps) {
  if (!status) return null;

  const copy = COPY[status.state];

  return (
    <section
      className={`license license--${status.state}`}
      role={status.state === 'expired' ? 'alert' : undefined}
    >
      <Icon name={copy.icon} size={22} />
      <div className="license__text">
        <h2 className="license__title">{copy.title}</h2>
        <p className="license__body">{copy.body.replace('{date}', status.dateLabel)}</p>
        <span className="license__meta">{status.relative}</span>
      </div>
    </section>
  );
}

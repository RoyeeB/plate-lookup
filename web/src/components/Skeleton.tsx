/**
 * Shimmering skeleton placeholder blocks, used while a lookup is loading.
 */
import { t } from '@/i18n';
import { PlateBadge } from './PlateBadge';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  radius?: number;
}

export function Skeleton({ width = '100%', height = 16, radius = 6 }: SkeletonProps) {
  return (
    <span
      className="skeleton"
      aria-hidden="true"
      style={{ width, height, borderRadius: radius }}
    />
  );
}

interface VehicleSkeletonProps {
  /** Already known from the URL, so the real plate shows from the first frame —
   *  which is also what lets the home screen's plate morph straight into it. */
  plate: string;
}

/** A full result-screen skeleton: hero + facts + spec rows. */
export function VehicleSkeleton({ plate }: VehicleSkeletonProps) {
  return (
    <div className="skeleton-stack" role="status" aria-label={t.states.loading}>
      <div className="skeleton-hero">
        <PlateBadge plate={plate} size="lg" hero />
        <Skeleton width={200} height={28} radius={8} />
        <Skeleton width={120} height={14} />
      </div>
      <div className="skeleton-facts">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={72} radius={16} />
        ))}
      </div>
      <div className="skeleton-card">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-row">
            <Skeleton width={90} height={14} />
            <Skeleton width={130} height={14} />
          </div>
        ))}
      </div>
    </div>
  );
}

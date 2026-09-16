/**
 * Pulsing skeleton placeholder blocks, used while a lookup is loading.
 */
interface SkeletonProps {
  width?: number | string;
  height?: number;
  radius?: number;
}

export function Skeleton({ width = '100%', height = 16, radius = 6 }: SkeletonProps) {
  return (
    <span
      className="skeleton"
      style={{ display: 'block', width, height, borderRadius: radius }}
    />
  );
}

/** A full result-screen skeleton: plate badge + spec rows + estimates block. */
export function VehicleSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }}>
      <Skeleton width={180} height={52} radius={12} />
      <div className="skeleton-card">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton-row">
            <Skeleton width={90} height={14} />
            <Skeleton width={130} height={14} />
          </div>
        ))}
      </div>
      <div className="skeleton-card skeleton-card--estimate">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton-row">
            <Skeleton width={80} height={14} />
            <Skeleton width={60} height={14} />
          </div>
        ))}
      </div>
    </div>
  );
}

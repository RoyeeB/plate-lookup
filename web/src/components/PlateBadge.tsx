/**
 * A read-only Israeli-plate-styled badge: black digits on yellow with the small
 * blue EU-style side strip. Digits render LTR even inside the RTL layout.
 */
import { formatPlate } from '@/lib/plate';

interface PlateBadgeProps {
  plate: string;
  size?: 'sm' | 'md' | 'lg';
  /**
   * The screen's main plate: gets the embossed look, the one-off sheen and the
   * view-transition name the home screen's plate morphs into. At most one per
   * screen.
   */
  hero?: boolean;
}

export function PlateBadge({ plate, size = 'md', hero = false }: PlateBadgeProps) {
  return (
    <span className={`plate-badge plate-badge--${size}${hero ? ' plate-badge--hero' : ''}`}>
      <span className="plate-badge__strip" aria-hidden="true">
        IL
      </span>
      <span className="plate-badge__digits">{formatPlate(plate)}</span>
    </span>
  );
}

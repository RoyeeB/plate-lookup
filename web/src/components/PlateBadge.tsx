/**
 * A read-only Israeli-plate-styled badge: black digits on yellow with the small
 * blue EU-style side strip. Digits render LTR even inside the RTL layout.
 */
import { formatPlate } from '@/lib/plate';

interface PlateBadgeProps {
  plate: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PlateBadge({ plate, size = 'md' }: PlateBadgeProps) {
  return (
    <span className={`plate-badge plate-badge--${size}`}>
      <span className="plate-badge__strip">IL</span>
      <span className="plate-badge__digits">{formatPlate(plate)}</span>
    </span>
  );
}

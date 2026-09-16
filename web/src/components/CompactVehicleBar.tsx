/**
 * A slim plate + name strip that slides in under the app header once the big
 * plate has scrolled off screen, so a long result page never loses track of
 * which car it is describing. Purely a visual echo of the hero: hidden from
 * assistive tech, which already has the heading.
 */
import { PlateBadge } from './PlateBadge';

interface CompactVehicleBarProps {
  plate: string;
  name: string | null;
  visible: boolean;
}

export function CompactVehicleBar({ plate, name, visible }: CompactVehicleBarProps) {
  return (
    // The outer element is a zero-height sticky anchor, so the bar overlays the
    // page instead of pushing the content down when it appears.
    <div className="compact-bar" aria-hidden="true" inert>
      <div className={`compact-bar__inner${visible ? ' compact-bar__inner--visible' : ''}`}>
        <PlateBadge plate={plate} size="sm" />
        {name && <span className="compact-bar__name">{name}</span>}
      </div>
    </div>
  );
}

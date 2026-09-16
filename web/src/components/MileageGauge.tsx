/**
 * A small speedometer for the yearly mileage: the needle sweeps to the car's
 * km/year on a 0–30,000 dial with a tick at the private-car average. Purely a
 * picture of the sentence next to it, so it is hidden from assistive tech.
 */
import type { MileageBand } from '@/lib/vehicleSummary';
import { AVERAGE_KM_PER_YEAR } from '@/lib/vehicleSummary';

/** Top of the dial. Anything above pins the needle rather than breaking the arc. */
export const GAUGE_MAX_KM = 30_000;

/** km/year → needle angle, from -90° (0 km) to +90° (the top of the dial). */
export function gaugeAngle(perYear: number): number {
  const ratio = Math.min(1, Math.max(0, perYear / GAUGE_MAX_KM));
  return -90 + ratio * 180;
}

interface MileageGaugeProps {
  perYear: number;
  band: MileageBand;
}

export function MileageGauge({ perYear, band }: MileageGaugeProps) {
  const angle = gaugeAngle(perYear);
  const average = gaugeAngle(AVERAGE_KM_PER_YEAR);
  // Dial reads left-to-right like a real instrument, even in an RTL layout.
  return (
    <svg
      className={`gauge gauge--${band}`}
      viewBox="0 0 100 58"
      width="96"
      height="56"
      aria-hidden="true"
      focusable="false"
      style={{ direction: 'ltr' }}
    >
      <path className="gauge__track" d="M 10 50 A 40 40 0 0 1 90 50" pathLength={100} />
      <path
        className="gauge__fill"
        d="M 10 50 A 40 40 0 0 1 90 50"
        pathLength={100}
        style={{ strokeDasharray: `${((angle + 90) / 180) * 100} 100` }}
      />
      <line
        className="gauge__tick"
        x1="50"
        y1="4"
        x2="50"
        y2="14"
        transform={`rotate(${average} 50 50)`}
      />
      <g className="gauge__needle" style={{ rotate: `${angle}deg` }}>
        <line x1="50" y1="50" x2="50" y2="18" />
      </g>
      <circle className="gauge__hub" cx="50" cy="50" r="4" />
    </svg>
  );
}

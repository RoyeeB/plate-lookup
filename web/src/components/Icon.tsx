/**
 * The small set of glyphs the app needs, as inline stroke SVG. This replaces
 * @expo/vector-icons (Ionicons) from the native build — inlining a dozen paths
 * is far cheaper than shipping an icon font to a browser.
 */
import type { CSSProperties, ReactElement } from 'react';

export type IconName =
  | 'camera'
  | 'search'
  | 'close'
  | 'chevron'
  | 'alert-circle'
  | 'warning'
  | 'car'
  | 'help-circle'
  | 'cloud-offline'
  | 'info-circle'
  | 'copy'
  | 'refresh'
  | 'check'
  | 'share'
  | 'flash'
  | 'flash-off'
  | 'calendar'
  | 'fuel'
  | 'gauge'
  | 'key'
  | 'sun'
  | 'moon'
  | 'monitor'
  | 'download'
  | 'compare'
  | 'clipboard-check'
  | 'x-circle'
  | 'check-circle';

const PATHS: Record<IconName, ReactElement> = {
  camera: (
    <>
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.6a1 1 0 0 0 .8-.4l1-1.3a1 1 0 0 1 .8-.4h4.6a1 1 0 0 1 .8.4l1 1.3a1 1 0 0 0 .8.4h1.6A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  chevron: <path d="m15 5-7 7 7 7" />,
  'alert-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5" />
      <path d="M12 16.4h.01" />
    </>
  ),
  warning: (
    <>
      <path d="M10.3 3.9 2.5 17.4a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>
  ),
  car: (
    <>
      <path d="M5 17h14M3.5 17v-4.2a2 2 0 0 1 .2-.9l2-4A2 2 0 0 1 7.5 7h9a2 2 0 0 1 1.8 1l2 4c.1.3.2.6.2.9V17" />
      <path d="M3.5 17v1.5a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5V17M17.5 17v1.5a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5V17" />
      <path d="M4 12.5h16" />
      <path d="M7.5 14.8h.01M16.5 14.8h.01" />
    </>
  ),
  'help-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.4a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.8-.9 1.4v.4" />
      <path d="M12 16.5h.01" />
    </>
  ),
  'cloud-offline': (
    <>
      <path d="M7.5 18.5h10a3.5 3.5 0 0 0 .6-6.95 5.5 5.5 0 0 0-8.4-4" />
      <path d="M7.5 18.5a3.5 3.5 0 0 1-.6-6.95" />
      <path d="M3.5 3.5 20.5 20.5" />
    </>
  ),
  'info-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <path d="M12 7.6h.01" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15a2 2 0 0 1-1-1.7V6a2 2 0 0 1 2-2h7.3A2 2 0 0 1 15 5" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20 4v4.5h-4.5" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  share: (
    <>
      <path d="M12 3v11" />
      <path d="m8.5 6.5 3.5-3.5 3.5 3.5" />
      <path d="M7.5 10.5H6a2 2 0 0 0-2 2v6.5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V12.5a2 2 0 0 0-2-2h-1.5" />
    </>
  ),
  flash: <path d="M13 2.5 5 13.5h6l-1 8 8-11.5h-6z" />,
  'flash-off': (
    <>
      <path d="M13 2.5 5 13.5h6l-1 8 8-11.5h-6z" />
      <path d="M3.5 3.5 20.5 20.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M8 3v4M16 3v4M3.5 10.5h17" />
    </>
  ),
  fuel: (
    <>
      <path d="M4.5 20.5V5a1.5 1.5 0 0 1 1.5-1.5h6A1.5 1.5 0 0 1 13.5 5v15.5" />
      <path d="M3 20.5h12M4.5 10h9" />
      <path d="M13.5 13h1.5a1.5 1.5 0 0 1 1.5 1.5v2a1.5 1.5 0 0 0 3 0V9l-3-3" />
    </>
  ),
  gauge: (
    <>
      <path d="M4.2 17.5a9 9 0 1 1 15.6 0" />
      <path d="m12 13.5 3.5-4" />
      <circle cx="12" cy="13.5" r="1.2" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />,
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="12.5" rx="2" />
      <path d="M8.5 20.5h7M12 16.5v4" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v11" />
      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
      <path d="M4.5 19.5h15" />
    </>
  ),
  compare: (
    <>
      <rect x="3.5" y="4" width="7" height="16" rx="1.5" />
      <rect x="13.5" y="4" width="7" height="16" rx="1.5" />
    </>
  ),
  'clipboard-check': (
    <>
      <rect x="5" y="4.5" width="14" height="16.5" rx="2" />
      <path d="M9 4.5V3.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="m9 13 2 2 4-4" />
    </>
  ),
  'x-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </>
  ),
  'check-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.8 2.8L16 10" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4.5" />
      <path d="m11.2 11.8 8.3-8.3M16.5 6.5l2.5 2.5M14 9l2 2" />
    </>
  ),
};

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  /** Rotate 180° — used for the chevron in an RTL list. */
  flip?: boolean;
  style?: CSSProperties;
}

export function Icon({ name, size = 22, color = 'currentColor', flip, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ flex: 'none', transform: flip ? 'scaleX(-1)' : undefined, ...style }}
    >
      {PATHS[name]}
    </svg>
  );
}

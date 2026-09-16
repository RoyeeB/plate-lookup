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
  | 'check';

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

/**
 * Central design tokens. Keep every color / spacing / radius value here so the
 * UI stays consistent (we use StyleSheet throughout, no NativeWind).
 */

export const colors = {
  // Israeli plate motif
  plateYellow: '#F4C400',
  plateYellowDark: '#D9AE00',
  plateBlack: '#111111',

  // Surfaces
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F3F4F6',
  surfaceEstimate: '#EEF2FF', // muted background for the "estimated" section

  // Text
  text: '#111827',
  textSecondary: '#6B7280',
  textOnYellow: '#111111',

  // Lines / borders
  border: '#E5E7EB',
  borderStrong: '#111111',

  // Accents / states
  primary: '#111827',
  info: '#4F46E5',
  success: '#16A34A',
  danger: '#DC2626',
  warning: '#D97706',

  // Camera overlay
  overlay: 'rgba(0,0,0,0.55)',
  guide: '#F4C400',

  // Skeleton
  skeletonBase: '#E5E7EB',
  skeletonHighlight: '#F3F4F6',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  plate: 40,
} as const;

/** Plate aspect ratio (Israeli plate ≈ 520mm x 110mm ≈ 4.7:1). */
export const PLATE_ASPECT_RATIO = 520 / 110;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;

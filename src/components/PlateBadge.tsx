/**
 * A read-only Israeli-plate-styled badge: black digits on yellow with the small
 * blue EU-style side strip. Digits render LTR even inside the RTL layout.
 */
import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/theme';
import { formatPlate } from '@/lib/plate';

interface PlateBadgeProps {
  plate: string;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

export function PlateBadge({ plate, size = 'md', style }: PlateBadgeProps) {
  const sizing = SIZES[size];
  return (
    <View style={[styles.container, { paddingVertical: sizing.padV, paddingHorizontal: sizing.padH }, style]}>
      <View style={styles.strip}>
        <Text style={styles.stripText}>IL</Text>
      </View>
      <Text
        style={[styles.digits, { fontSize: sizing.font }]}
        // Force LTR so the number reads correctly inside RTL screens.
        allowFontScaling
        numberOfLines={1}
      >
        {formatPlate(plate)}
      </Text>
    </View>
  );
}

const SIZES = {
  sm: { font: fontSize.lg, padV: spacing.xs, padH: spacing.sm },
  md: { font: fontSize.xl, padV: spacing.sm, padH: spacing.md },
  lg: { font: fontSize.plate, padV: spacing.md, padH: spacing.lg },
} as const;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', // LTR internal order: blue strip then digits
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.plateYellow,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.plateBlack,
    direction: 'ltr',
  },
  strip: {
    backgroundColor: '#0033A0',
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: 4,
    marginEnd: spacing.sm,
  },
  stripText: {
    color: '#FFFFFF',
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  digits: {
    color: colors.plateBlack,
    fontWeight: '800',
    letterSpacing: 2,
    writingDirection: 'ltr',
    fontVariant: ['tabular-nums'],
  },
});

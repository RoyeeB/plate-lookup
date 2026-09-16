/**
 * Darkened camera overlay with a transparent rectangular cutout sized to a
 * license plate's aspect ratio, corner accents, and a hint line.
 */
import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors, fontSize, radius, spacing, PLATE_ASPECT_RATIO } from '@/theme';
import { t } from '@/i18n';

export function ScanGuideOverlay() {
  const { width } = useWindowDimensions();
  const boxWidth = Math.min(width * 0.86, 420);
  const boxHeight = boxWidth / PLATE_ASPECT_RATIO;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Top scrim */}
      <View style={styles.scrim} />
      {/* Middle band: side scrims + transparent cutout */}
      <View style={[styles.band, { height: boxHeight }]}>
        <View style={styles.scrim} />
        <View style={[styles.cutout, { width: boxWidth, height: boxHeight }]}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
        <View style={styles.scrim} />
      </View>
      {/* Bottom scrim + hint */}
      <View style={[styles.scrim, styles.bottom]}>
        <Text style={styles.hint}>{t.scan.hint}</Text>
      </View>
    </View>
  );
}

const CORNER = 28;
const BORDER = 4;

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  band: {
    flexDirection: 'row',
  },
  cutout: {
    borderRadius: radius.md,
  },
  bottom: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  hint: {
    color: '#FFFFFF',
    fontSize: fontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
    paddingHorizontal: spacing.xl,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: colors.guide,
  },
  tl: { top: 0, start: 0, borderTopWidth: BORDER, borderStartWidth: BORDER, borderTopStartRadius: radius.md },
  tr: { top: 0, end: 0, borderTopWidth: BORDER, borderEndWidth: BORDER, borderTopEndRadius: radius.md },
  bl: { bottom: 0, start: 0, borderBottomWidth: BORDER, borderStartWidth: BORDER, borderBottomStartRadius: radius.md },
  br: { bottom: 0, end: 0, borderBottomWidth: BORDER, borderEndWidth: BORDER, borderBottomEndRadius: radius.md },
});

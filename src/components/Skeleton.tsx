/**
 * Pulsing skeleton placeholder blocks, used while a lookup is loading.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type DimensionValue } from 'react-native';
import { colors, radius, spacing } from '@/theme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: object;
}

export function Skeleton({ width = '100%', height = 16, radius: r = 6, style }: SkeletonProps) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: r, backgroundColor: colors.skeletonBase, opacity: pulse },
        style,
      ]}
    />
  );
}

/** A full result-screen skeleton: plate badge + spec rows + estimates block. */
export function VehicleSkeleton() {
  return (
    <View style={styles.wrap}>
      <Skeleton width={180} height={52} radius={radius.md} />
      <View style={styles.card}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={i} style={styles.row}>
            <Skeleton width={90} height={14} />
            <Skeleton width={130} height={14} />
          </View>
        ))}
      </View>
      <View style={[styles.card, styles.estimateCard]}>
        {Array.from({ length: 3 }).map((_, i) => (
          <View key={i} style={styles.row}>
            <Skeleton width={80} height={14} />
            <Skeleton width={60} height={14} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  estimateCard: {
    backgroundColor: colors.surfaceEstimate,
    borderColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

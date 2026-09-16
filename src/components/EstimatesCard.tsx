/**
 * "נתונים משוערים" — estimated specs card. Visually distinct (muted indigo
 * background, info icon, disclaimer) so it never reads as official registry data.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '@/theme';
import { t } from '@/i18n';
import type { EstimatedSpec } from '@/api/types';

interface EstimatesCardProps {
  specs: EstimatedSpec[];
}

export function EstimatesCard({ specs }: EstimatesCardProps) {
  if (specs.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="information-circle" size={20} color={colors.info} />
        <Text style={styles.title}>{t.vehicle.estimatedTitle}</Text>
      </View>
      <Text style={styles.disclaimer}>{t.vehicle.estimatedDisclaimer}</Text>

      <View style={styles.grid}>
        {specs.map((spec) => (
          <View key={spec.key} style={styles.cell}>
            <Text style={styles.value}>{spec.value}</Text>
            <Text style={styles.label}>{spec.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceEstimate,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(79,70,229,0.15)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.info,
    writingDirection: 'rtl',
  },
  disclaimer: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.lg,
    writingDirection: 'rtl',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  cell: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  value: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
});

/**
 * Official registry spec card. Renders the mapped fields as label/value rows.
 * The VIN row (misgeret) is long-pressable to copy, with a toast confirmation.
 */
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing, shadow } from '@/theme';
import { t } from '@/i18n';
import { useToast } from '@/hooks/useToast';
import type { MappedField } from '@/api/mapper';

interface SpecCardProps {
  title: string;
  fields: MappedField[];
}

export function SpecCard({ title, fields }: SpecCardProps) {
  const toast = useToast();

  const copyVin = useCallback(
    async (value: string) => {
      await Clipboard.setStringAsync(value);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.show(t.vehicle.copyVin);
    },
    [toast]
  );

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {fields.map((field, index) => {
        const isLast = index === fields.length - 1;
        const row = (
          <View style={[styles.row, !isLast && styles.rowBorder]}>
            <Text style={styles.label}>{field.label}</Text>
            <View style={styles.valueWrap}>
              <Text
                style={[styles.value, field.copyable && styles.valueMono]}
                selectable={field.copyable}
              >
                {field.value}
              </Text>
              {field.copyable && (
                <Ionicons
                  name="copy-outline"
                  size={16}
                  color={colors.textSecondary}
                  style={styles.copyIcon}
                />
              )}
            </View>
          </View>
        );

        if (field.copyable) {
          return (
            <Pressable
              key={field.key}
              onLongPress={() => void copyVin(field.value)}
              delayLongPress={350}
              accessibilityHint={t.vehicle.copyHint}
            >
              {row}
            </Pressable>
          );
        }
        return <View key={field.key}>{row}</View>;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...shadow.card,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    paddingVertical: spacing.md,
    writingDirection: 'rtl',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    writingDirection: 'rtl',
    flexShrink: 0,
  },
  valueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    justifyContent: 'flex-end',
  },
  value: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    writingDirection: 'rtl',
    textAlign: 'left',
    flexShrink: 1,
  },
  valueMono: {
    fontVariant: ['tabular-nums'],
    writingDirection: 'ltr',
  },
  copyIcon: {
    marginStart: spacing.xs,
  },
});

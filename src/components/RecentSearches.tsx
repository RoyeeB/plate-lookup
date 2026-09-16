/**
 * "חיפושים אחרונים" list. Each row shows a plate badge and re-runs the search
 * on tap. Includes a clear-history action.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '@/theme';
import { t } from '@/i18n';
import { PlateBadge } from './PlateBadge';

interface RecentSearchesProps {
  plates: string[];
  onSelect: (plate: string) => void;
  onClear: () => void;
}

export function RecentSearches({ plates, onSelect, onClear }: RecentSearchesProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.home.recentTitle}</Text>
        {plates.length > 0 && (
          <Pressable onPress={onClear} hitSlop={10} accessibilityRole="button">
            <Text style={styles.clear}>{t.home.clearRecent}</Text>
          </Pressable>
        )}
      </View>

      {plates.length === 0 ? (
        <Text style={styles.empty}>{t.home.recentEmpty}</Text>
      ) : (
        <View style={styles.list}>
          {plates.map((plate) => (
            <Pressable
              key={plate}
              onPress={() => onSelect(plate)}
              accessibilityRole="button"
              accessibilityLabel={`חפש שוב לוחית ${plate}`}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <PlateBadge plate={plate} size="sm" />
              <Ionicons
                name="chevron-back"
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.text,
    writingDirection: 'rtl',
  },
  clear: {
    fontSize: fontSize.sm,
    color: colors.info,
    writingDirection: 'rtl',
  },
  empty: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    writingDirection: 'rtl',
    paddingVertical: spacing.md,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 56,
  },
  rowPressed: {
    backgroundColor: colors.surfaceMuted,
  },
});

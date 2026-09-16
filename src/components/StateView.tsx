/**
 * Generic centered state screen (icon + title + body + optional actions).
 * Reused for not-found, network-error, offline, and permission-denied states.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '@/theme';
import { PrimaryButton } from './PrimaryButton';

interface Action {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'plate' | 'secondary' | 'ghost';
  icon?: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
}

interface StateViewProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  body?: string;
  actions?: Action[];
}

export function StateView({ icon, iconColor = colors.textSecondary, title, body, actions }: StateViewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <View style={[styles.iconCircle, { backgroundColor: `${iconColor}1A` }]}>
          <Ionicons name={icon} size={44} color={iconColor} />
        </View>
        <Text style={styles.title}>{title}</Text>
        {body && <Text style={styles.body}>{body}</Text>}
      </View>

      {actions && actions.length > 0 && (
        <View style={styles.actions}>
          {actions.map((action) => (
            <PrimaryButton
              key={action.label}
              label={action.label}
              onPress={action.onPress}
              variant={action.variant ?? 'primary'}
              icon={action.icon}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.xl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  body: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    writingDirection: 'rtl',
    paddingHorizontal: spacing.md,
  },
  actions: {
    gap: spacing.md,
  },
});

/**
 * Buttons with large tap targets for one-handed use. `variant` controls look;
 * `icon` is an optional Ionicons glyph name shown before the label.
 */
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '@/theme';

type Variant = 'primary' | 'plate' | 'secondary' | 'ghost';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  loading = false,
  style,
}: PrimaryButtonProps) {
  const palette = VARIANTS[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: palette.bg, borderColor: palette.border },
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.content}>
          {icon && <Ionicons name={icon} size={22} color={palette.fg} style={styles.icon} />}
          <Text style={[styles.label, { color: palette.fg }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const VARIANTS: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.plateBlack, fg: '#FFFFFF', border: colors.plateBlack },
  plate: { bg: colors.plateYellow, fg: colors.plateBlack, border: colors.plateBlack },
  secondary: { bg: colors.surfaceMuted, fg: colors.text, border: colors.border },
  ghost: { bg: 'transparent', fg: colors.text, border: 'transparent' },
};

const styles = StyleSheet.create({
  base: {
    minHeight: 56, // large tap target
    borderRadius: radius.lg,
    borderWidth: 2,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginEnd: spacing.sm,
  },
  label: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.5,
  },
});

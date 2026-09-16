/**
 * Large Israeli-plate-styled numeric input: black digits on yellow with a
 * rounded border and the blue EU strip. Digits are LTR & centered even in RTL.
 */
import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/theme';
import { MAX_PLATE_DIGITS } from '@/lib/plate';

interface PlateInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmitEditing?: () => void;
  placeholder?: string;
}

export function PlateInput({
  value,
  onChangeText,
  onSubmitEditing,
  placeholder,
}: PlateInputProps) {
  const handleChange = (text: string) => {
    // Keep only digits, cap at max length.
    const digits = text.replace(/\D+/g, '').slice(0, MAX_PLATE_DIGITS);
    onChangeText(digits);
  };

  return (
    <View style={styles.container}>
      <View style={styles.strip}>
        <Text style={styles.stripText}>IL</Text>
      </View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={handleChange}
        onSubmitEditing={onSubmitEditing}
        placeholder={placeholder}
        placeholderTextColor="rgba(17,17,17,0.35)"
        keyboardType="number-pad"
        inputMode="numeric"
        returnKeyType="search"
        maxLength={MAX_PLATE_DIGITS}
        textAlign="center"
        // Keep the field LTR so digits type left-to-right.
        accessibilityLabel="שדה הזנת מספר לוחית"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.plateYellow,
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: colors.plateBlack,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    direction: 'ltr',
  },
  strip: {
    backgroundColor: '#0033A0',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginEnd: spacing.md,
  },
  stripText: {
    color: '#FFFFFF',
    fontSize: fontSize.sm,
    fontWeight: '800',
  },
  input: {
    flex: 1,
    color: colors.plateBlack,
    fontSize: fontSize.plate,
    fontWeight: '800',
    letterSpacing: 4,
    padding: 0,
    writingDirection: 'ltr',
    fontVariant: ['tabular-nums'],
  },
});

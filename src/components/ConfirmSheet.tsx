/**
 * Bottom sheet that shows the OCR-detected digits in an editable plate field.
 * The user must confirm — we never search automatically after a scan.
 */
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, radius, spacing } from '@/theme';
import { t } from '@/i18n';
import { isValidPlate } from '@/lib/plate';
import { PlateInput } from './PlateInput';
import { PrimaryButton } from './PrimaryButton';

interface ConfirmSheetProps {
  visible: boolean;
  initialPlate: string;
  onConfirm: (plate: string) => void;
  onCancel: () => void;
}

export function ConfirmSheet({ visible, initialPlate, onConfirm, onCancel }: ConfirmSheetProps) {
  const [plate, setPlate] = useState(initialPlate);
  const insets = useSafeAreaInsets();

  // Sync when a new detection opens the sheet.
  useEffect(() => {
    if (visible) setPlate(initialPlate);
  }, [visible, initialPlate]);

  const valid = isValidPlate(plate);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrap}
      >
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>{t.scan.confirmTitle}</Text>
          <Text style={styles.subtitle}>{t.scan.confirmSubtitle}</Text>

          <PlateInput value={plate} onChangeText={setPlate} />

          {!valid && plate.length > 0 && (
            <Text style={styles.error}>{t.home.invalidPlate}</Text>
          )}

          <View style={styles.actions}>
            <PrimaryButton
              label={t.scan.confirmSearch}
              icon="search"
              onPress={() => onConfirm(plate)}
              disabled={!valid}
            />
            <PrimaryButton label={t.scan.confirmCancel} variant="ghost" onPress={onCancel} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
  },
  error: {
    fontSize: fontSize.sm,
    color: colors.danger,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});

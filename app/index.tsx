import React, { useCallback, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { colors, fontSize, spacing } from '@/theme';
import { t } from '@/i18n';
import { isValidPlate, normalizePlate } from '@/lib/plate';
import { useRecentSearches } from '@/api/queries';
import { PlateInput } from '@/components/PlateInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RecentSearches } from '@/components/RecentSearches';

export default function HomeScreen() {
  const [plate, setPlate] = useState('');
  const [showError, setShowError] = useState(false);
  const { recent, add, clear, refresh } = useRecentSearches();

  // Refresh history whenever we return to Home.
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const goToVehicle = useCallback(
    async (raw: string) => {
      const normalized = normalizePlate(raw);
      if (!isValidPlate(normalized)) {
        setShowError(true);
        return;
      }
      Keyboard.dismiss();
      await add(normalized);
      router.push(`/vehicle/${normalized}`);
    },
    [add]
  );

  const onSearch = useCallback(() => {
    void goToVehicle(plate);
  }, [goToVehicle, plate]);

  const onSelectRecent = useCallback(
    (p: string) => {
      setPlate(p);
      void goToVehicle(p);
    },
    [goToVehicle]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{t.home.title}</Text>
            <Text style={styles.subtitle}>{t.home.subtitle}</Text>
          </View>

          <PlateInput
            value={plate}
            onChangeText={(text) => {
              setPlate(text);
              if (showError) setShowError(false);
            }}
            onSubmitEditing={onSearch}
            placeholder={t.home.platePlaceholder}
          />
          {showError && <Text style={styles.error}>{t.home.invalidPlate}</Text>}

          <View style={styles.recent}>
            <RecentSearches plates={recent} onSelect={onSelectRecent} onClear={() => void clear()} />
          </View>
        </ScrollView>

        {/* Bottom-anchored primary actions for one-handed use */}
        <View style={styles.actions}>
          <PrimaryButton
            label={t.home.scanButton}
            icon="camera"
            variant="plate"
            onPress={() => router.push('/scan')}
          />
          <PrimaryButton
            label={t.home.searchButton}
            icon="search"
            variant="primary"
            onPress={onSearch}
            disabled={!isValidPlate(plate)}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    gap: spacing.lg,
    flexGrow: 1,
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.text,
    writingDirection: 'rtl',
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 24,
    writingDirection: 'rtl',
  },
  error: {
    fontSize: fontSize.sm,
    color: colors.danger,
    writingDirection: 'rtl',
  },
  recent: {
    flex: 1,
    marginTop: spacing.sm,
  },
  actions: {
    padding: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});

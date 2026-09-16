import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '@/theme';
import { t } from '@/i18n';
import { isValidPlate, normalizePlate } from '@/lib/plate';
import { isNotFound, useVehicle } from '@/api/queries';
import { mapOfficialFields } from '@/api/mapper';
import { estimateSpecs } from '@/lib/estimates';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { PlateBadge } from '@/components/PlateBadge';
import { SpecCard } from '@/components/SpecCard';
import { EstimatesCard } from '@/components/EstimatesCard';
import { VehicleSkeleton } from '@/components/Skeleton';
import { StateView } from '@/components/StateView';
import { PrimaryButton } from '@/components/PrimaryButton';

export default function VehicleScreen() {
  const params = useLocalSearchParams<{ plate: string }>();
  const plate = normalizePlate(params.plate ?? '');
  const { offline } = useNetworkStatus();

  const query = useVehicle(plate);
  const { data, isLoading, isError, error, refetch, isFetching } = query;

  const officialFields = useMemo(
    () => (data ? mapOfficialFields(data.record) : []),
    [data]
  );
  const estimatedSpecs = useMemo(
    () => (data ? estimateSpecs(data.record) : []),
    [data]
  );

  const goHome = () => router.replace('/');

  // Invalid plate in the URL.
  if (!isValidPlate(plate)) {
    return (
      <Screen>
        <StateView
          icon="help-circle-outline"
          title={t.states.notFoundTitle}
          body={t.home.invalidPlate}
          actions={[{ label: t.states.notFoundCta, icon: 'search', onPress: goHome }]}
        />
      </Screen>
    );
  }

  // Offline with nothing cached to show.
  if (offline && !data) {
    return (
      <Screen>
        <StateView
          icon="cloud-offline-outline"
          iconColor={colors.warning}
          title={t.states.offlineTitle}
          body={t.states.offlineBody}
          actions={[{ label: t.states.retry, icon: 'refresh', onPress: () => void refetch() }]}
        />
      </Screen>
    );
  }

  // Loading — skeleton, not a bare spinner.
  if (isLoading) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
          <VehicleSkeleton />
        </ScrollView>
      </Screen>
    );
  }

  // Not found vs. transport error.
  if (isError) {
    if (isNotFound(error)) {
      return (
        <Screen>
          <View style={styles.badgeHeader}>
            <PlateBadge plate={plate} size="md" />
          </View>
          <StateView
            icon="car-outline"
            title={t.states.notFoundTitle}
            body={t.states.notFoundBody}
            actions={[{ label: t.states.notFoundCta, icon: 'search', onPress: goHome }]}
          />
        </Screen>
      );
    }
    return (
      <Screen>
        <StateView
          icon="warning-outline"
          iconColor={colors.danger}
          title={t.states.errorTitle}
          body={t.states.errorBody}
          actions={[{ label: t.states.retry, icon: 'refresh', onPress: () => void refetch() }]}
        />
      </Screen>
    );
  }

  if (!data) return null;

  // Success.
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.badgeHeader}>
          <PlateBadge plate={plate} size="lg" />
        </View>

        {data.isInactive && (
          <View style={styles.inactiveBanner}>
            <Ionicons name="alert-circle" size={20} color={colors.warning} />
            <Text style={styles.inactiveText}>{data.datasetLabel}</Text>
          </View>
        )}

        <SpecCard title={t.vehicle.officialTitle} fields={officialFields} />

        <EstimatesCard specs={estimatedSpecs} />

        <Text style={styles.source}>{t.vehicle.source}</Text>
      </ScrollView>

      <View style={styles.actions}>
        <PrimaryButton label={t.vehicle.searchAgain} icon="search" onPress={goHome} loading={isFetching && !isLoading} />
      </View>
    </Screen>
  );
}

/** Shared screen chrome (safe area + background). */
function Screen({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  badgeHeader: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  inactiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(217,119,6,0.12)',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  inactiveText: {
    fontSize: fontSize.sm,
    color: colors.warning,
    fontWeight: '700',
    writingDirection: 'rtl',
    flexShrink: 1,
  },
  source: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: spacing.sm,
  },
  actions: {
    padding: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});

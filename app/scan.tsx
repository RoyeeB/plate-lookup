import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, fontSize, radius, spacing } from '@/theme';
import { t } from '@/i18n';
import { extractPlateFromResult, type MlkitTextResult } from '@/lib/ocr';
import { normalizePlate } from '@/lib/plate';
import { useRecentSearches } from '@/api/queries';
import { ScanGuideOverlay } from '@/components/ScanGuideOverlay';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { PrimaryButton } from '@/components/PrimaryButton';
import { StateView } from '@/components/StateView';

type ScanState = 'camera' | 'processing' | 'confirm' | 'error';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [state, setState] = useState<ScanState>('camera');
  const [detected, setDetected] = useState('');
  const { add } = useRecentSearches();

  const runOcr = useCallback(async () => {
    const camera = cameraRef.current;
    if (!camera || state === 'processing') return;

    setState('processing');
    try {
      const photo = await camera.takePictureAsync({ quality: 0.8, skipProcessing: false });
      if (!photo?.uri) {
        setState('error');
        return;
      }
      const result = (await TextRecognition.recognize(photo.uri)) as MlkitTextResult;
      const plate = extractPlateFromResult(result);

      if (plate) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setDetected(plate);
        setState('confirm'); // never auto-search — user must confirm
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setState('error');
      }
    } catch {
      setState('error');
    }
  }, [state]);

  const onConfirm = useCallback(
    async (plate: string) => {
      const normalized = normalizePlate(plate);
      setState('camera');
      await add(normalized);
      router.replace(`/vehicle/${normalized}`);
    },
    [add]
  );

  // --- Permission gate ---
  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.plateYellow} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionSafe}>
        <StateView
          icon="camera-outline"
          iconColor={colors.warning}
          title={t.permission.title}
          body={t.permission.body}
          actions={[
            permission.canAskAgain
              ? { label: t.permission.grant, icon: 'camera', onPress: () => void requestPermission() }
              : { label: t.permission.openSettings, icon: 'settings-outline', onPress: () => void Linking.openSettings() },
            { label: t.permission.back, variant: 'ghost', onPress: () => router.back() },
          ]}
        />
      </SafeAreaView>
    );
  }

  // --- Camera ---
  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
      <ScanGuideOverlay />

      {/* Top bar: close */}
      <SafeAreaView style={styles.topBar} edges={['top']}>
        <Pressable
          onPress={() => router.back()}
          style={styles.iconButton}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t.states.back}
        >
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </Pressable>
      </SafeAreaView>

      {/* Bottom capture control */}
      <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
        <Pressable
          onPress={() => void runOcr()}
          disabled={state === 'processing'}
          style={styles.shutterOuter}
          accessibilityRole="button"
          accessibilityLabel={t.scan.capture}
        >
          <View style={styles.shutterInner} />
        </Pressable>
      </SafeAreaView>

      {/* Processing overlay */}
      {state === 'processing' && (
        <View style={styles.processing}>
          <ActivityIndicator size="large" color={colors.plateYellow} />
          <Text style={styles.processingText}>{t.scan.processing}</Text>
        </View>
      )}

      {/* No-plate-detected error banner */}
      {state === 'error' && (
        <View style={styles.errorSheet}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.warning} />
          <Text style={styles.errorText}>{t.scan.noPlateDetected}</Text>
          <View style={styles.errorActions}>
            <PrimaryButton label={t.scan.retake} icon="camera" variant="plate" onPress={() => setState('camera')} />
            <PrimaryButton
              label={t.scan.manualEntry}
              variant="secondary"
              onPress={() => router.replace('/')}
            />
          </View>
        </View>
      )}

      <ConfirmSheet
        visible={state === 'confirm'}
        initialPlate={detected}
        onConfirm={(plate) => void onConfirm(plate)}
        onCancel={() => setState('camera')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionSafe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    alignItems: 'flex-start',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    start: 0,
    end: 0,
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: radius.pill,
    borderWidth: 5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    backgroundColor: colors.plateYellow,
  },
  processing: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: fontSize.lg,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  errorSheet: {
    position: 'absolute',
    start: spacing.lg,
    end: spacing.lg,
    bottom: spacing.xxl,
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  errorText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  errorActions: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});

import 'react-native-safe-area-context';
import { useEffect } from 'react';
import { I18nManager } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { QueryProvider } from '@/providers/QueryProvider';
import { ToastProvider } from '@/hooks/useToast';
import { colors, fontSize } from '@/theme';
import { t } from '@/i18n';

/**
 * Force RTL as early as possible (module scope, before first render). React
 * Native applies a forced RTL direction only after a JS reload — see the README
 * note. `allowRTL(true)` + `forceRTL(true)` make Hebrew the default direction.
 */
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background);
    // Nothing async to await here; hide the splash on first mount.
    void SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryProvider>
        <ToastProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.text,
              headerTitleStyle: { fontWeight: '800', fontSize: fontSize.lg },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: colors.background },
              headerBackTitle: t.states.back,
            }}
          >
            <Stack.Screen name="index" options={{ title: t.appName }} />
            <Stack.Screen
              name="scan"
              options={{ title: t.scan.title, presentation: 'fullScreenModal', headerShown: false }}
            />
            <Stack.Screen name="vehicle/[plate]" options={{ title: t.vehicle.officialTitle }} />
          </Stack>
        </ToastProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}

/**
 * Lightweight toast provider — a single bottom-anchored, auto-dismissing
 * message. Used for the "VIN copied" confirmation and similar feedback.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, radius, spacing } from '@/theme';

interface ToastContextValue {
  show: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const show = useCallback(
    (msg: string) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setMessage(msg);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();

      hideTimer.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) setMessage(null);
        });
      }, 1800);
    },
    [opacity]
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message !== null && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.container,
            { opacity, bottom: insets.bottom + spacing.xxl },
          ]}
        >
          <View style={styles.toast}>
            <Text style={styles.text}>{message}</Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    start: 0,
    end: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  toast: {
    backgroundColor: colors.plateBlack,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    maxWidth: '100%',
  },
  text: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});

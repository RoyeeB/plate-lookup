/**
 * Thin wrapper over expo-network's live network state. `offline` is true only
 * when we're confident there's no connectivity (so we don't false-positive
 * while the reachability probe is still resolving).
 */
import { useNetworkState } from 'expo-network';

export interface NetworkStatus {
  offline: boolean;
  isConnected: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const state = useNetworkState();
  // isConnected can be undefined before the first probe resolves — treat unknown
  // as "online" to avoid flashing an offline screen on cold start.
  const isConnected = state.isConnected ?? true;
  const reachable = state.isInternetReachable ?? true;
  return {
    isConnected,
    offline: isConnected === false || reachable === false,
  };
}

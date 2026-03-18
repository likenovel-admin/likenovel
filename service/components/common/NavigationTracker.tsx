'use client';

import { useFunnelRouteTracker } from '@/hooks/useFunnelRouteTracker';
import { useNavigationHistory } from '@/hooks/useNavigationHistory';
import { useProductDetailExitSignal } from '@/hooks/useProductDetailExitSignal';

/**
 * Component to track navigation history across the app
 * Should be placed in the root layout
 */
export default function NavigationTracker() {
  useNavigationHistory();
  useFunnelRouteTracker();
  useProductDetailExitSignal();
  return null;
}

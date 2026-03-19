'use client';

import { useFunnelRouteTracker } from '@/hooks/useFunnelRouteTracker';
import { useNavigationHistory } from '@/hooks/useNavigationHistory';
import { useProductDetailExitSignal } from '@/hooks/useProductDetailExitSignal';
import { logViewerTrace } from '@/utils/viewerTrace';
import { useEffect } from 'react';

/**
 * Component to track navigation history across the app
 * Should be placed in the root layout
 */
export default function NavigationTracker() {
  useNavigationHistory();
  useFunnelRouteTracker();
  useProductDetailExitSignal();

  useEffect(() => {
    logViewerTrace("navigation-tracker", "mounted");
    return () => {
      logViewerTrace("navigation-tracker", "unmounted");
    };
  }, []);

  return null;
}

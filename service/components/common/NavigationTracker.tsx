'use client';

import { useNavigationHistory } from '@/hooks/useNavigationHistory';

/**
 * Component to track navigation history across the app
 * Should be placed in the root layout
 */
export default function NavigationTracker() {
  useNavigationHistory();
  return null;
}

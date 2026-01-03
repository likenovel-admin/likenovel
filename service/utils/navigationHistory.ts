/**
 * Navigation history tracker using sessionStorage
 */

const HISTORY_KEY = 'navigation_history';
const MAX_HISTORY = 20;

export interface NavigationHistoryItem {
  path: string;
  timestamp: number;
}

/**
 * Get navigation history from sessionStorage
 */
export const getNavigationHistory = (): NavigationHistoryItem[] => {
  if (typeof window === 'undefined') return [];

  try {
    const history = sessionStorage.getItem(HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
};

/**
 * Add current path to navigation history
 */
export const addToNavigationHistory = (path: string): void => {
  if (typeof window === 'undefined') return;

  try {
    const history = getNavigationHistory();

    // Don't add if it's the same as the last entry
    if (history.length > 0 && history[history.length - 1].path === path) {
      return;
    }

    const newEntry: NavigationHistoryItem = {
      path,
      timestamp: Date.now(),
    };

    const updatedHistory = [...history, newEntry].slice(-MAX_HISTORY);
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Failed to save navigation history:', error);
  }
};

/**
 * Find the most recent path that doesn't match the given patterns
 */
export const findPreviousNonMatchingPath = (excludePatterns: RegExp[]): string | null => {
  const history = getNavigationHistory();

  // Start from second-to-last (skip current page)
  for (let i = history.length - 2; i >= 0; i--) {
    const item = history[i];
    const isExcluded = excludePatterns.some(pattern => pattern.test(item.path));

    if (!isExcluded) {
      return item.path;
    }
  }

  return null;
};

/**
 * Clear navigation history
 */
export const clearNavigationHistory = (): void => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(HISTORY_KEY);
};

/**
 * Debug: Log navigation history to console
 */
export const logNavigationHistory = (): void => {
  const history = getNavigationHistory();
  console.log('Navigation History:');
  history.forEach((item, index) => {
    const date = new Date(item.timestamp).toLocaleTimeString();
    console.log(`  [${index}] ${item.path} (${date})`);
  });
};

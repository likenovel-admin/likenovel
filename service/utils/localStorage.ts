/**
 * Common localStorage utilities
 * Provides type-safe access to localStorage with error handling
 */

export const STORAGE_KEYS = {
  IS_SCROLL: "viewer_is_scroll",
  RECENT_SIGN_IN_TYPE: "recent_sign_in_type",
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  KEEP_SIGNIN_YN: "keep_signin_yn",
  RECENT_VIEWED_PRODUCTS: "recent_viewed_products",
  FREE_TOP_VIEW_TYPE: "free_top_view_type",
  PAID_TOP_VIEW_TYPE: "paid_top_view_type",
  PREVIOUS_PAGE: "previous_page",
  POPUP_CLOSED_UNTIL: "popup_closed_until",
  AI_RECOMMEND_OPEN_AFTER_LOGIN: "ai_recommend_open_after_login",
  QUEST_REWARD_AFTER_LOGIN: "quest_reward_after_login",
  STORY_AGENT_GUEST_KEY: "story_agent_guest_key",
} as const;

/**
 * Get item from localStorage
 * @param key - Storage key
 * @returns Value or null if not found or error
 */
export const getLocalStorage = <T = string>(key: string): T | null => {
  try {
    if (typeof window === "undefined") return null;
    const item = localStorage.getItem(key);
    if (item === null) return null;

    // Try to parse JSON, if fails return as string
    try {
      return JSON.parse(item) as T;
    } catch {
      return item as T;
    }
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return null;
  }
};

/**
 * Set item in localStorage
 * @param key - Storage key
 * @param value - Value to store (will be JSON stringified if object)
 * @returns Success status
 */
export const setLocalStorage = (key: string, value: any): boolean => {
  try {
    if (typeof window === "undefined") return false;
    const stringValue =
      typeof value === "string" ? value : JSON.stringify(value);
    localStorage.setItem(key, stringValue);
    return true;
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
    return false;
  }
};

/**
 * Remove item from localStorage
 * @param key - Storage key
 * @returns Success status
 */
export const removeLocalStorage = (key: string): boolean => {
  try {
    if (typeof window === "undefined") return false;
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
    return false;
  }
};

/**
 * Clear all localStorage
 * @returns Success status
 */
export const clearLocalStorage = (): boolean => {
  try {
    if (typeof window === "undefined") return false;
    localStorage.clear();
    return true;
  } catch (error) {
    console.error("Error clearing localStorage:", error);
    return false;
  }
};

/**
 * Check if key exists in localStorage
 * @param key - Storage key
 * @returns True if key exists
 */
export const hasLocalStorage = (key: string): boolean => {
  try {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(key) !== null;
  } catch (error) {
    console.error(`Error checking localStorage key "${key}":`, error);
    return false;
  }
};

import { STORAGE_KEYS } from "@/utils/localStorage";
import {
  clearExpiredAuthSessionMarker,
  SIGN_UP_FORM_DATA_SESSION_KEY,
} from "@/utils/authSession";
import { ISocialLoginProvider, ITokens, IUser } from "@/types";
import { create } from "zustand";

interface IAuthState {
  isAuthInitialized: boolean;
  isAuthenticated: boolean;
  user: IUser | null;
  accessToken: string | null;
  setAccessToken: (newToken: string) => void;
  refreshToken: string | null;
  setRefreshToken: (newToken: string) => void;
  signIn: (
    tokens: ITokens,
    recentSignInType: ISocialLoginProvider,
    userData?: any,
    keepSignIn?: string
  ) => void;
  signOut: () => void;
  setState: (newState: Partial<IAuthState>) => void;
}

const useAuthStore = create<IAuthState>((set) => ({
  isAuthInitialized: false,
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,

  signIn: (tokens, recentSignInType, userData, keepSignIn = "Y") => {
    const user = userData
      ? {
          userId: userData.userId,
          birthDate: userData.birthDate,
          gender: userData.gender,
          isAdult: true, // Will be updated by useSelectUser call
          userRole: "user" as any, // Will be updated by useSelectUser call
        }
      : null;

    set({
      isAuthInitialized: true,
      isAuthenticated: true,
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });

    // Store tokens based on keep_signin_yn preference
    if (keepSignIn === "Y") {
      // Keep sign in: use localStorage (persists after browser closes)
      localStorage.setItem("access_token", tokens.accessToken);
      localStorage.setItem("refresh_token", tokens.refreshToken);
      localStorage.setItem("recent_sign_in_type", recentSignInType);
      localStorage.setItem("keep_signin_yn", keepSignIn);

      // Clear from sessionStorage to avoid conflicts
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("refresh_token");
      sessionStorage.removeItem("recent_sign_in_type");
    } else {
      // Don't keep sign in: use sessionStorage (cleared when browser closes)
      sessionStorage.setItem("access_token", tokens.accessToken);
      sessionStorage.setItem("refresh_token", tokens.refreshToken);
      // sessionStorage.setItem("recent_sign_in_type", recentSignInType);
      localStorage.setItem("recent_sign_in_type", recentSignInType);
      sessionStorage.setItem("keep_signin_yn", keepSignIn);

      // Clear from localStorage to ensure tokens are removed when browser closes
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      // localStorage.removeItem("recent_sign_in_type");
      localStorage.removeItem("keep_signin_yn");
    }

    if (user) {
      sessionStorage.setItem("user", JSON.stringify(user));
    }
    clearExpiredAuthSessionMarker(sessionStorage);
    sessionStorage.removeItem(SIGN_UP_FORM_DATA_SESSION_KEY);
  },

  signOut: () => {
    set({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
    });
    // Avoid broad sessionStorage clearing; analytics/session attribution keys are not auth-owned.
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    // localStorage.removeItem("recent_sign_in_type");
    localStorage.removeItem("keep_signin_yn");
    localStorage.removeItem("recent_viewed_products");
    localStorage.removeItem(STORAGE_KEYS.QUEST_REWARD_AFTER_LOGIN);
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("recent_sign_in_type");
    sessionStorage.removeItem("keep_signin_yn");
    sessionStorage.removeItem("user");
    clearExpiredAuthSessionMarker(sessionStorage);
    sessionStorage.removeItem(SIGN_UP_FORM_DATA_SESSION_KEY);
  },

  setAccessToken: (newToken) => {
    set((state) => ({
      ...state,
      accessToken: newToken,
    }));
    // Update token in the appropriate storage based on keep_signin_yn preference
    const keepSignInLocal = localStorage.getItem("keep_signin_yn");
    const keepSignInSession = sessionStorage.getItem("keep_signin_yn");

    if (keepSignInLocal === "Y") {
      localStorage.setItem("access_token", newToken);
    } else if (keepSignInSession === "N") {
      sessionStorage.setItem("access_token", newToken);
    } else {
      // Default to localStorage if no preference is set
      localStorage.setItem("access_token", newToken);
    }
  },

  setRefreshToken: (newToken) => {
    set((state) => ({
      ...state,
      refreshToken: newToken,
    }));
    const keepSignInLocal = localStorage.getItem("keep_signin_yn");
    const keepSignInSession = sessionStorage.getItem("keep_signin_yn");

    if (keepSignInLocal === "Y") {
      localStorage.setItem("refresh_token", newToken);
    } else if (keepSignInSession === "N") {
      sessionStorage.setItem("refresh_token", newToken);
    } else {
      localStorage.setItem("refresh_token", newToken);
    }
  },

  setState: (newState) => {
    set((state) => {
      const updatedState = {
        ...state,
        ...newState,
      };
      if (updatedState.user) {
        sessionStorage.setItem("user", JSON.stringify(updatedState.user));
      }
      return updatedState;
    });
  },
}));

export default useAuthStore;

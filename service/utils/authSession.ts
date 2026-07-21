type AuthStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type AuthorizationHeaders = Record<string, unknown> & {
  delete?: (header: string) => void;
};

const AUTH_TOKEN_KEYS = ["access_token", "refresh_token"] as const;
export const AUTH_SESSION_EXPIRED_SESSION_KEY = "ln_auth_session_expired";
export const SIGN_UP_FORM_DATA_SESSION_KEY = "formData";
const SENSITIVE_AUTH_SESSION_KEYS = [SIGN_UP_FORM_DATA_SESSION_KEY] as const;

export const hasStoredAuthToken = (
  localStorage: Pick<Storage, "getItem">,
  sessionStorage: Pick<Storage, "getItem">
) => {
  return AUTH_TOKEN_KEYS.some(
    (key) => !!localStorage.getItem(key) || !!sessionStorage.getItem(key)
  );
};

export const hasExpiredAuthSession = (
  sessionStorage: Pick<Storage, "getItem">
) => sessionStorage.getItem(AUTH_SESSION_EXPIRED_SESSION_KEY) === "Y";

export const clearExpiredAuthSessionMarker = (
  sessionStorage: Pick<Storage, "removeItem">
) => {
  sessionStorage.removeItem(AUTH_SESSION_EXPIRED_SESSION_KEY);
};

export const shouldRequireReauthentication = ({
  isAuthInitialized,
  canUseAccountScope,
  hasExpiredSession,
}: {
  isAuthInitialized: boolean;
  canUseAccountScope: boolean;
  hasExpiredSession: boolean;
}) => isAuthInitialized && !canUseAccountScope && hasExpiredSession;

export const clearAuthorizationHeaders = (
  authorizationHeaders?: AuthorizationHeaders | null
) => {
  if (!authorizationHeaders) return;

  if (typeof authorizationHeaders.delete === "function") {
    authorizationHeaders.delete("Authorization");
    authorizationHeaders.delete("authorization");
  }

  delete authorizationHeaders.Authorization;
  delete authorizationHeaders.authorization;
};

export const clearStaleAuthSession = ({
  localStorage,
  sessionStorage,
  authorizationHeaders,
}: {
  localStorage: AuthStorage;
  sessionStorage: AuthStorage;
  authorizationHeaders?: AuthorizationHeaders | null;
}) => {
  for (const key of AUTH_TOKEN_KEYS) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }

  try {
    sessionStorage.setItem(AUTH_SESSION_EXPIRED_SESSION_KEY, "Y");
  } catch (error) {
    console.error("[auth] Failed to mark expired auth session:", error);
  }
  sessionStorage.removeItem("user");
  for (const key of SENSITIVE_AUTH_SESSION_KEYS) {
    sessionStorage.removeItem(key);
  }
  clearAuthorizationHeaders(authorizationHeaders);
};

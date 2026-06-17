type AuthStorage = Pick<Storage, "getItem" | "removeItem">;

type AuthorizationHeaders = Record<string, unknown> & {
  delete?: (header: string) => void;
};

const AUTH_TOKEN_KEYS = ["access_token", "refresh_token"] as const;
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

  sessionStorage.removeItem("user");
  for (const key of SENSITIVE_AUTH_SESSION_KEYS) {
    sessionStorage.removeItem(key);
  }
  clearAuthorizationHeaders(authorizationHeaders);
};

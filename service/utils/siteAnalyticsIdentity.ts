export const SITE_ANALYTICS_VISITOR_ID_KEY = "ln_site_pv_visitor_id";
export const SITE_ANALYTICS_SESSION_ID_KEY = "ln_site_pv_session_id";

let memoryVisitorId: string | null = null;
let memorySessionId: string | null = null;

const randomId = (prefix: string): string => {
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${uuid}`;
};

export const createSiteAnalyticsEventId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  const randomPart = Math.random().toString(16).slice(2).padEnd(12, "0").slice(0, 12);
  return `00000000-0000-4000-8000-${randomPart}`;
};

export const safeGetSiteAnalyticsStorageItem = (
  storage: Storage | null,
  key: string
): string | null => {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetStorageItem = (
  storage: Storage | null,
  key: string,
  value: string
) => {
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {
    // Analytics must not depend on storage availability.
  }
};

export const getSiteAnalyticsStorage = (
  kind: "local" | "session"
): Storage | null => {
  if (typeof window === "undefined") return null;
  return kind === "local" ? window.localStorage : window.sessionStorage;
};

const getOrCreateId = (
  storage: Storage | null,
  key: string,
  prefix: string,
  memoryValue: string | null,
  setMemoryValue: (value: string) => void
) => {
  const existing = safeGetSiteAnalyticsStorageItem(storage, key);
  if (existing) {
    setMemoryValue(existing);
    return existing;
  }
  if (memoryValue) return memoryValue;

  const next = randomId(prefix);
  setMemoryValue(next);
  safeSetStorageItem(storage, key, next);
  return next;
};

export const getSiteAnalyticsIdentity = (storage?: {
  local: Storage | null;
  session: Storage | null;
}) => {
  const local = storage ? storage.local : getSiteAnalyticsStorage("local");
  const session = storage
    ? storage.session
    : getSiteAnalyticsStorage("session");

  return {
    visitorId: getOrCreateId(
      local,
      SITE_ANALYTICS_VISITOR_ID_KEY,
      "pv",
      memoryVisitorId,
      (value) => {
        memoryVisitorId = value;
      }
    ),
    browserSessionId: getOrCreateId(
      session,
      SITE_ANALYTICS_SESSION_ID_KEY,
      "pvs",
      memorySessionId,
      (value) => {
        memorySessionId = value;
      }
    ),
  };
};

export const getSiteAnalyticsAccessToken = (): string | null =>
  safeGetSiteAnalyticsStorageItem(
    getSiteAnalyticsStorage("local"),
    "access_token"
  ) ||
  safeGetSiteAnalyticsStorageItem(
    getSiteAnalyticsStorage("session"),
    "access_token"
  );

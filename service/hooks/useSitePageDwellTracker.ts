"use client";

import {
  buildSitePageDwellPayload,
  shouldTrackSitePageDwellPath,
} from "@/utils/sitePageViewTaxonomy";
import {
  getNextKstMidnightDelayMs,
  resumeSitePageDwellVisibleWindow,
} from "@/utils/sitePageDwellTiming";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

const VISITOR_ID_KEY = "ln_site_pv_visitor_id";
const SESSION_ID_KEY = "ln_site_pv_session_id";
let memoryVisitorId: string | null = null;
let memorySessionId: string | null = null;

type ActiveDwellPage = {
  pathname: string;
  visitorId: string;
  sessionId: string;
  startedAt: number;
  visibleStartedAt: number | null;
  accumulatedMs: number;
};

function randomId(prefix: string): string {
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${uuid}`;
}

function randomEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  const randomPart = Math.random().toString(16).slice(2).padEnd(12, "0").slice(0, 12);
  return `00000000-0000-4000-8000-${randomPart}`;
}

function safeGetStorageItem(storage: Storage | null, key: string): string | null {
  if (!storage) {
    return null;
  }
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetStorageItem(storage: Storage | null, key: string, value: string) {
  if (!storage) {
    return;
  }
  try {
    storage.setItem(key, value);
  } catch {
    // Dwell logging must not depend on storage availability.
  }
}

function getBrowserStorage(kind: "local" | "session"): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }
  return kind === "local" ? window.localStorage : window.sessionStorage;
}

function getOrCreateLocalId(
  storage: Storage | null,
  key: string,
  prefix: string,
  memoryValue: string | null,
  setMemoryValue: (value: string) => void
): string {
  const existing = safeGetStorageItem(storage, key);
  if (existing) {
    setMemoryValue(existing);
    return existing;
  }
  if (memoryValue) {
    return memoryValue;
  }
  const next = randomId(prefix);
  setMemoryValue(next);
  safeSetStorageItem(storage, key, next);
  return next;
}

function getAccessToken(): string | null {
  return (
    safeGetStorageItem(getBrowserStorage("local"), "access_token") ||
    safeGetStorageItem(getBrowserStorage("session"), "access_token")
  );
}

function getVisibleStartedAt(now: number): number | null {
  if (typeof document === "undefined") {
    return null;
  }
  return document.visibilityState === "visible" ? now : null;
}

export function useSitePageDwellTracker() {
  const pathname = usePathname();
  const activePageRef = useRef<ActiveDwellPage | null>(null);

  const flushCurrentPage = useCallback(() => {
    try {
      const current = activePageRef.current;
      if (!current) {
        return;
      }

      const now = Date.now();
      const visibleDelta =
        current.visibleStartedAt == null ? 0 : now - current.visibleStartedAt;
      const activeMs = current.accumulatedMs + Math.max(visibleDelta, 0);
      const payload = buildSitePageDwellPayload({
        pathname: current.pathname,
        visitorId: current.visitorId,
        sessionId: current.sessionId,
        eventId: randomEventId(),
        occurredAt: new Date(current.startedAt).toISOString(),
        activeMs,
      });

      current.startedAt = now;
      current.accumulatedMs = 0;
      current.visibleStartedAt = getVisibleStartedAt(now);

      if (!payload) {
        return;
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const accessToken = getAccessToken();
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      fetch("/api/v1/command/statistics/page-dwell", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {
        // Dwell logging must never block or redirect the user flow.
      });
    } catch {
      // Dwell logging must never block or redirect the user flow.
    }
  }, []);

  useEffect(() => {
    flushCurrentPage();
    activePageRef.current = null;

    try {
      if (!pathname || !shouldTrackSitePageDwellPath(pathname)) {
        return;
      }
      if (process.env.NEXT_PUBLIC_SITE_DWELL_TRACKING_ENABLED === "false") {
        return;
      }

      const now = Date.now();
      const visitorId = getOrCreateLocalId(
        getBrowserStorage("local"),
        VISITOR_ID_KEY,
        "pv",
        memoryVisitorId,
        (value) => {
          memoryVisitorId = value;
        }
      );
      const sessionId = getOrCreateLocalId(
        getBrowserStorage("session"),
        SESSION_ID_KEY,
        "pvs",
        memorySessionId,
        (value) => {
          memorySessionId = value;
        }
      );

      activePageRef.current = {
        pathname,
        visitorId,
        sessionId,
        startedAt: now,
        visibleStartedAt: getVisibleStartedAt(now),
        accumulatedMs: 0,
      };

      let isTrackingCurrentPage = true;
      let kstMidnightTimer: number | null = null;
      const scheduleKstMidnightFlush = () => {
        if (!isTrackingCurrentPage) {
          return;
        }
        kstMidnightTimer = window.setTimeout(() => {
          if (!isTrackingCurrentPage) {
            return;
          }
          flushCurrentPage();
          scheduleKstMidnightFlush();
        }, getNextKstMidnightDelayMs(Date.now()));
      };
      scheduleKstMidnightFlush();

      return () => {
        isTrackingCurrentPage = false;
        if (kstMidnightTimer) {
          window.clearTimeout(kstMidnightTimer);
        }
        flushCurrentPage();
        activePageRef.current = null;
      };
    } catch {
      activePageRef.current = null;
    }
  }, [flushCurrentPage, pathname]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const current = activePageRef.current;
      if (!current) {
        return;
      }

      const now = Date.now();
      if (document.visibilityState === "hidden") {
        flushCurrentPage();
        return;
      }

      resumeSitePageDwellVisibleWindow(current, now);
    };

    const handlePageHide = () => {
      flushCurrentPage();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      flushCurrentPage();
    };
  }, [flushCurrentPage]);
}

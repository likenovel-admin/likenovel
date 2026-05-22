"use client";

import {
  buildSitePageViewPayload,
  shouldTrackSitePageViewPath,
} from "@/utils/sitePageViewTaxonomy";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const VISITOR_ID_KEY = "ln_site_pv_visitor_id";
const SESSION_ID_KEY = "ln_site_pv_session_id";
const LAST_PV_KEY = "ln_site_pv_last_key";
const DEDUPE_WINDOW_MS = 2000;
let memoryVisitorId: string | null = null;
let memorySessionId: string | null = null;
let memoryLastPageView: { key: string; at: number } | null = null;

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
    // Storage availability must not block PV logging.
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

function shouldSendPageView(currentKey: string, now: number): boolean {
  const sessionStorageRef = getBrowserStorage("session");
  const rawLast = safeGetStorageItem(sessionStorageRef, LAST_PV_KEY);
  if (!rawLast && !memoryLastPageView) {
    memoryLastPageView = { key: currentKey, at: now };
    safeSetStorageItem(
      sessionStorageRef,
      LAST_PV_KEY,
      JSON.stringify({ key: currentKey, at: now })
    );
    return true;
  }

  try {
    const last = rawLast
      ? (JSON.parse(rawLast) as { key?: string; at?: number })
      : memoryLastPageView;
    if (last && last.key === currentKey && typeof last.at === "number" && now - last.at < DEDUPE_WINDOW_MS) {
      return false;
    }
  } catch {
    // Corrupted sessionStorage should not block PV logging.
  }

  memoryLastPageView = { key: currentKey, at: now };
  safeSetStorageItem(
    sessionStorageRef,
    LAST_PV_KEY,
    JSON.stringify({ key: currentKey, at: now })
  );
  return true;
}

export function useSitePageViewTracker() {
  const pathname = usePathname();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      if (!pathname || !shouldTrackSitePageViewPath(pathname)) {
        return;
      }

      if (process.env.NEXT_PUBLIC_SITE_PV_TRACKING_ENABLED === "false") {
        return;
      }

      const now = Date.now();
      if (!shouldSendPageView(pathname, now)) {
        return;
      }

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
      const payload = buildSitePageViewPayload({
        pathname,
        search: "",
        referrerPath: previousPathRef.current,
        visitorId,
        sessionId,
        eventId: randomEventId(),
        occurredAt: new Date().toISOString(),
      });

      previousPathRef.current = pathname;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const accessToken = getAccessToken();
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      fetch("/api/v1/command/statistics/page-view", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {
        // PV logging must never block or redirect the user flow.
      });
    } catch {
      // PV logging must never block or redirect the user flow.
    }
  }, [pathname]);
}

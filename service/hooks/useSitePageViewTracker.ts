"use client";

import {
  buildSitePageViewPayload,
  shouldTrackSitePageViewPath,
} from "@/utils/sitePageViewTaxonomy";
import {
  extractMarketingAttribution,
  getMarketingAttributionCookiePayload,
  hasMarketingAttributionSignal,
  MARKETING_ATTRIBUTION_STORAGE_KEY,
  parseMarketingAttributionValue,
  resolveSessionMarketingAttribution,
  type MarketingAttribution,
} from "@/utils/marketingAttribution";
import { resolveProductEntryAttribution } from "@/utils/productEntryAttribution";
import { getProductDetailEntrySource } from "@/utils/productPath";
import {
  createSiteAnalyticsEventId,
  getSiteAnalyticsAccessToken,
  getSiteAnalyticsIdentity,
  getSiteAnalyticsStorage,
  safeGetSiteAnalyticsStorageItem,
} from "@/utils/siteAnalyticsIdentity";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const LAST_PV_KEY = "ln_site_pv_last_key";
const DEDUPE_WINDOW_MS = 2000;
let memoryLastPageView: { key: string; at: number } | null = null;

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

function getSessionMarketingAttribution(): MarketingAttribution | null {
  if (typeof window === "undefined") {
    return null;
  }

  const sessionStorageRef = getSiteAnalyticsStorage("session");
  const currentAttribution = extractMarketingAttribution({
    search: window.location.search,
    referrer: document.referrer,
    currentHost: window.location.host,
    pathname: window.location.pathname,
  });
  const cookieAttribution = getMarketingAttributionCookiePayload(document.cookie);
  const storedAttribution = parseMarketingAttributionValue(
    safeGetSiteAnalyticsStorageItem(
      sessionStorageRef,
      MARKETING_ATTRIBUTION_STORAGE_KEY
    )
  );
  const selectedAttribution = resolveSessionMarketingAttribution({
    pathname: window.location.pathname,
    currentAttribution,
    cookieAttribution,
    storedAttribution,
  });

  if (hasMarketingAttributionSignal(selectedAttribution)) {
    safeSetStorageItem(
      sessionStorageRef,
      MARKETING_ATTRIBUTION_STORAGE_KEY,
      JSON.stringify(selectedAttribution)
    );
  }

  return selectedAttribution;
}

function shouldSendPageView(currentKey: string, now: number): boolean {
  const sessionStorageRef = getSiteAnalyticsStorage("session");
  const rawLast = safeGetSiteAnalyticsStorageItem(sessionStorageRef, LAST_PV_KEY);
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

      const { visitorId, browserSessionId: sessionId } =
        getSiteAnalyticsIdentity();
      const search = typeof window !== "undefined" ? window.location.search : "";
      const marketingAttribution = getSessionMarketingAttribution();
      const urlEntrySource = getProductDetailEntrySource(
        new URLSearchParams(search).get("entrySource")
      );
      const productEntryAttribution = resolveProductEntryAttribution({
        pathname,
        referrerPath: previousPathRef.current,
        entrySource: urlEntrySource,
        marketingAttribution,
      });
      const payload = buildSitePageViewPayload({
        pathname,
        search,
        referrerPath: previousPathRef.current,
        visitorId,
        sessionId,
        eventId: createSiteAnalyticsEventId(),
        occurredAt: new Date().toISOString(),
        marketingAttribution,
        productEntryAttribution,
      });

      previousPathRef.current = pathname;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const accessToken = getSiteAnalyticsAccessToken();
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

"use client";

import {
  buildSitePageDwellPayload,
  shouldTrackSitePageDwellPath,
} from "@/utils/sitePageViewTaxonomy";
import {
  getNextKstMidnightDelayMs,
  resumeSitePageDwellVisibleWindow,
} from "@/utils/sitePageDwellTiming";
import {
  createSiteAnalyticsEventId,
  getSiteAnalyticsAccessToken,
  getSiteAnalyticsIdentity,
} from "@/utils/siteAnalyticsIdentity";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

type ActiveDwellPage = {
  pathname: string;
  visitorId: string;
  sessionId: string;
  startedAt: number;
  visibleStartedAt: number | null;
  accumulatedMs: number;
};

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
        eventId: createSiteAnalyticsEventId(),
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
      const accessToken = getSiteAnalyticsAccessToken();
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
      const { visitorId, browserSessionId: sessionId } =
        getSiteAnalyticsIdentity();

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

"use client";

import { usePostAiSignalEvent } from "@/app/api/query/recommendation";
import useAuthStore from "@/store/authStore";
import {
  buildProductDetailExitCandidateKey,
  clearLastProductDetailExitCandidate,
  clearLastProductDetailTransitionDecision,
  completeLastProductDetailExitCandidate,
  isLastProductDetailExitCandidateSent,
  peekLastProductDetailExitCandidate,
} from "@/utils/funnelRouteTracker";
import {
  getReaderFunnelDestinationGroup,
  postReaderFunnelEventBestEffort,
} from "@/utils/readerFunnelSignal";
import {
  createSiteAnalyticsEventId,
  getSiteAnalyticsIdentity,
} from "@/utils/siteAnalyticsIdentity";
import { logViewerTrace } from "@/utils/viewerTrace";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

export const useProductDetailExitSignal = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const { mutate: postAiSignalEvent } = usePostAiSignalEvent();
  const { user, isAuthInitialized, isAuthenticated, accessToken } = useAuthStore((state) => ({
    user: state.user,
    isAuthInitialized: state.isAuthInitialized,
    isAuthenticated: state.isAuthenticated,
    accessToken: state.accessToken,
  }));
  const attemptedCandidateKeyRef = useRef<string | null>(null);
  const guestCandidateEventRef = useRef<{
    candidateKey: string;
    eventId: string;
  } | null>(null);

  const flushExitCandidate = useCallback(() => {
    const candidate = peekLastProductDetailExitCandidate();
    if (!candidate) {
      logViewerTrace("product-detail-exit", "no-candidate", undefined, {
        pathname,
      });
      return;
    }

    if (!isAuthInitialized) {
      logViewerTrace("product-detail-exit", "skip-no-user-scope", {
        candidate,
      });
      return;
    }

    const candidateKey = buildProductDetailExitCandidateKey(candidate);
    if (isLastProductDetailExitCandidateSent(candidate)) {
      clearLastProductDetailExitCandidate();
      clearLastProductDetailTransitionDecision();
      attemptedCandidateKeyRef.current = candidateKey;
      logViewerTrace("product-detail-exit", "skip-already-sent", {
        candidateKey,
        candidate,
      });
      return;
    }

    if (!isAuthenticated) {
      const identity = getSiteAnalyticsIdentity();
      const eventId =
        guestCandidateEventRef.current?.candidateKey === candidateKey
          ? guestCandidateEventRef.current.eventId
          : createSiteAnalyticsEventId();
      guestCandidateEventRef.current = { candidateKey, eventId };
      postReaderFunnelEventBestEffort({
        eventId,
        occurredAt: new Date(candidate.evaluatedAt).toISOString(),
        ...identity,
        productId: candidate.sourceProductId,
        eventType: "product_detail_exit",
        activeMs: Math.max(
          0,
          Math.round((candidate.activeSeconds || 0) * 1000)
        ),
        destinationGroup: getReaderFunnelDestinationGroup(candidate),
      });
      completeLastProductDetailExitCandidate(candidate);
      attemptedCandidateKeyRef.current = candidateKey;
      logViewerTrace("product-detail-exit", "post-success", {
        candidateKey,
        lane: "guest",
      });
      return;
    }

    const canUseUserScope = !!accessToken && !!user?.userId;
    if (!canUseUserScope) {
      logViewerTrace("product-detail-exit", "skip-no-user-scope", {
        candidate,
      });
      return;
    }

    if (attemptedCandidateKeyRef.current === candidateKey) {
      logViewerTrace("product-detail-exit", "skip-duplicate-attempt", {
        candidateKey,
      });
      return;
    }
    attemptedCandidateKeyRef.current = candidateKey;
    logViewerTrace("product-detail-exit", "post-start", {
      candidateKey,
      candidate,
    });

    postAiSignalEvent(
      {
        product_id: candidate.sourceProductId,
        event_type: "product_detail_exit",
        active_seconds: Math.max(0, Math.floor(candidate.activeSeconds || 0)),
        event_payload: {
          source_path: candidate.sourcePath,
          destination_path: candidate.destinationPath,
          destination_page_type: candidate.destinationPageType,
          ...(candidate.destinationProductId
            ? { destination_product_id: candidate.destinationProductId }
            : {}),
          reason: candidate.reason,
        },
      },
      {
        onSuccess: () => {
          completeLastProductDetailExitCandidate(candidate);
          logViewerTrace("product-detail-exit", "post-success", {
            candidateKey,
          });
        },
        onError: (error) => {
          console.error("[aiSignal] product_detail_exit failed", error);
          logViewerTrace("product-detail-exit", "post-error", {
            candidateKey,
            error: error instanceof Error ? error.message : error,
          });
        },
      }
    );
  }, [
    accessToken,
    isAuthInitialized,
    isAuthenticated,
    pathname,
    postAiSignalEvent,
    user?.userId,
  ]);

  useEffect(() => {
    flushExitCandidate();
  }, [flushExitCandidate, pathname, searchKey]);

  useEffect(() => {
    const handleSynced = () => {
      flushExitCandidate();
    };

    window.addEventListener(
      "funnel:product-detail-transition-synced",
      handleSynced as EventListener
    );
    return () => {
      window.removeEventListener(
        "funnel:product-detail-transition-synced",
        handleSynced as EventListener
      );
    };
  }, [flushExitCandidate]);
};

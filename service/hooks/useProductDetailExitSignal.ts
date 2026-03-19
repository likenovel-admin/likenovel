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
import { logViewerTrace } from "@/utils/viewerTrace";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

export const useProductDetailExitSignal = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const { mutate: postAiSignalEvent } = usePostAiSignalEvent();
  const { user, isAuthenticated, accessToken } = useAuthStore((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    accessToken: state.accessToken,
  }));
  const attemptedCandidateKeyRef = useRef<string | null>(null);

  const flushExitCandidate = useCallback(() => {
    const candidate = peekLastProductDetailExitCandidate();
    if (!candidate) {
      logViewerTrace("product-detail-exit", "no-candidate", undefined, {
        pathname,
      });
      return;
    }

    const canUseUserScope = !!accessToken && !!user?.userId && isAuthenticated;
    if (!canUseUserScope) {
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
  }, [accessToken, isAuthenticated, pathname, postAiSignalEvent, user?.userId]);

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

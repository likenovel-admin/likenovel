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
      return;
    }

    const canUseUserScope = !!accessToken && !!user?.userId && isAuthenticated;
    if (!canUseUserScope) {
      return;
    }

    const candidateKey = buildProductDetailExitCandidateKey(candidate);
    if (isLastProductDetailExitCandidateSent(candidate)) {
      clearLastProductDetailExitCandidate();
      clearLastProductDetailTransitionDecision();
      attemptedCandidateKeyRef.current = candidateKey;
      return;
    }

    if (attemptedCandidateKeyRef.current === candidateKey) {
      return;
    }
    attemptedCandidateKeyRef.current = candidateKey;

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
        },
        onError: (error) => {
          console.error("[aiSignal] product_detail_exit failed", error);
        },
      }
    );
  }, [accessToken, isAuthenticated, postAiSignalEvent, user?.userId]);

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

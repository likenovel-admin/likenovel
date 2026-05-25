import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";

type UseAiLibrarianDwellRevealOptions = {
  productId: number;
  enabled?: boolean;
  dwellMs?: number;
  threshold?: number;
};

type RevealEventDetail = {
  productId: number;
};

const REVEAL_EVENT = "likenovel:ai-librarian-preview-reveal";
export const AI_LIBRARIAN_DWELL_MIN_SCROLL_Y = 120;
const registeredElements = new Map<number, HTMLElement>();
let activeProductId: number | null = null;

export const shouldAllowAiLibrarianDwellRevealAtScroll = (scrollY: number) =>
  scrollY >= AI_LIBRARIAN_DWELL_MIN_SCROLL_Y;

const getVisibleRatio = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  if (rect.height <= 0) return 0;

  const visibleTop = Math.max(rect.top, 0);
  const visibleBottom = Math.min(rect.bottom, window.innerHeight);
  return Math.max(0, visibleBottom - visibleTop) / rect.height;
};

const getBestVisibleProductId = (threshold: number) => {
  const viewportCenter = window.innerHeight / 2;
  let bestProductId: number | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  registeredElements.forEach((element, productId) => {
    const ratio = getVisibleRatio(element);
    if (ratio < threshold) return;

    const rect = element.getBoundingClientRect();
    const distance = Math.abs(rect.top + rect.height / 2 - viewportCenter);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestProductId = productId;
    }
  });

  return bestProductId;
};

const announceReveal = (productId: number) => {
  if (activeProductId === productId) return;
  activeProductId = productId;
  window.dispatchEvent(
    new CustomEvent<RevealEventDetail>(REVEAL_EVENT, {
      detail: { productId },
    })
  );
};

export const useAiLibrarianDwellReveal = ({
  productId,
  enabled = true,
  dwellMs = 900,
  threshold = 0.6,
}: UseAiLibrarianDwellRevealOptions): {
  ref: RefObject<HTMLDivElement>;
  isRevealed: boolean;
} => {
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isVisibleRef = useRef(false);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    if (!enabled) {
      if (activeProductId === productId) activeProductId = null;
      setIsRevealed(false);
      return;
    }

    const element = ref.current;
    if (!element || typeof window === "undefined") return;

    registeredElements.set(productId, element);

    const clearTimer = () => {
      if (!timerRef.current) return;
      clearTimeout(timerRef.current);
      timerRef.current = null;
    };

    const clearReveal = () => {
      const wasActive = activeProductId === productId;
      clearTimer();
      if (!wasActive) return;
      activeProductId = null;
      setIsRevealed(false);
    };

    const canScheduleReveal = () =>
      isVisibleRef.current &&
      shouldAllowAiLibrarianDwellRevealAtScroll(window.scrollY);

    const scheduleReveal = () => {
      clearTimer();
      if (!canScheduleReveal()) {
        clearReveal();
        return;
      }

      timerRef.current = setTimeout(() => {
        if (!canScheduleReveal()) {
          clearReveal();
          return;
        }

        const bestProductId = getBestVisibleProductId(threshold);
        if (bestProductId != null) {
          announceReveal(bestProductId);
        }
      }, dwellMs);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = Boolean(
          entry?.isIntersecting && entry.intersectionRatio >= threshold
        );
        if (!isVisibleRef.current) {
          clearReveal();
          return;
        }
        scheduleReveal();
      },
      { threshold: [0, threshold, 1] }
    );

    const handleScroll = () => {
      if (!isVisibleRef.current) {
        clearReveal();
        return;
      }
      scheduleReveal();
    };

    const handleReveal = (event: Event) => {
      const detail = (event as CustomEvent<RevealEventDetail>).detail;
      setIsRevealed(detail?.productId === productId);
    };

    observer.observe(element);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    window.addEventListener(REVEAL_EVENT, handleReveal);

    return () => {
      clearTimer();
      observer.disconnect();
      registeredElements.delete(productId);
      if (activeProductId === productId) activeProductId = null;
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      window.removeEventListener(REVEAL_EVENT, handleReveal);
    };
  }, [dwellMs, enabled, productId, threshold]);

  return { ref, isRevealed };
};

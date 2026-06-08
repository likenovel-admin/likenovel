"use client";

import { IHomeTickerItem } from "@/app/api/query/product/dto";
import {
  buildProductDetailPath,
  PRODUCT_DETAIL_ENTRY_SOURCE,
  setPendingProductDetailEntrySource,
} from "@/utils/productPath";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface HomeTickerProps {
  items?: IHomeTickerItem[] | null;
  rotateEveryMs?: number | null;
}

const HOME_TICKER_FALLBACK_MESSAGE =
  "오늘도 새로운 이야기가 라이크노벨에서 독자를 만나고 있습니다.";
const HOME_TICKER_BLOCKED_TERMS = ["연독률", "재유입", "전환율"];
const HOME_TICKER_DEFAULT_ROTATE_EVERY_MS = 5000;
const HOME_TICKER_MIN_ROTATE_EVERY_MS = 3000;

const fallbackItem: IHomeTickerItem = {
  type: "fallback",
  message: HOME_TICKER_FALLBACK_MESSAGE,
  productId: null,
  priority: 0,
  freshness: "fallback",
};

const hasBlockedTerm = (message: string) =>
  HOME_TICKER_BLOCKED_TERMS.some((term) => message.includes(term));

const normalizeTickerItem = (item: IHomeTickerItem): IHomeTickerItem | null => {
  const message = item.message.trim();
  if (!message || hasBlockedTerm(message)) {
    return null;
  }

  return {
    ...item,
    message,
  };
};

const usePrefersReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () =>
      setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updatePreference);
      return () => mediaQuery.removeEventListener("change", updatePreference);
    }

    mediaQuery.addListener(updatePreference);
    return () => mediaQuery.removeListener(updatePreference);
  }, []);

  return prefersReducedMotion;
};

const HomeTicker = ({ items, rotateEveryMs }: HomeTickerProps) => {
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const displayItems = useMemo(() => {
    const normalizedItems = (items ?? [])
      .map(normalizeTickerItem)
      .filter((item): item is IHomeTickerItem => item !== null);
    return normalizedItems.length > 0 ? normalizedItems : [fallbackItem];
  }, [items]);

  const activeItem = displayItems[activeIndex] ?? fallbackItem;
  const isClickable =
    typeof activeItem.productId === "number" && activeItem.productId > 0;
  const messageRollClassName = prefersReducedMotion
    ? ""
    : "home-ticker-message-roll";

  useEffect(() => {
    setActiveIndex(0);
  }, [displayItems]);

  useEffect(() => {
    if (prefersReducedMotion || displayItems.length <= 1) return;

    const intervalMs = Math.max(
      rotateEveryMs || HOME_TICKER_DEFAULT_ROTATE_EVERY_MS,
      HOME_TICKER_MIN_ROTATE_EVERY_MS
    );
    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % displayItems.length);
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [displayItems.length, prefersReducedMotion, rotateEveryMs]);

  const handleClick = () => {
    if (!isClickable || activeItem.productId === null) return;

    setPendingProductDetailEntrySource(
      activeItem.productId,
      PRODUCT_DETAIL_ENTRY_SOURCE.HOME_TICKER
    );
    router.push(buildProductDetailPath(activeItem.productId));
  };

  const content = (
    <div className="flex min-h-[52px] w-full items-center gap-10pxr rounded-none bg-primary-100 px-16pxr py-12pxr text-white shadow-[0_2px_8px_rgba(23,107,242,0.16)] md:min-h-[58px] md:px-28pxr">
      <span className="shrink-0 rounded-full bg-white/20 px-10pxr py-4pxr text-12pxr font-bold leading-[16px]">
        LIVE
      </span>
      <span className="relative h-[20px] min-w-0 flex-1 overflow-hidden md:h-[24px]">
        <span
          key={`home-ticker-${activeIndex}-${activeItem.message}`}
          className={`block truncate text-14pxr font-semibold leading-[20px] md:text-17pxr md:leading-[24px] ${messageRollClassName}`}
        >
          {activeItem.message}
        </span>
      </span>
    </div>
  );

  return (
    <div data-home-ticker className="w-full px-16pxr md:px-0">
      {isClickable ? (
        <button
          type="button"
          onClick={handleClick}
          className="block w-full text-left transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-100"
          aria-label={`${activeItem.message} 작품 보기`}
        >
          {content}
        </button>
      ) : (
        <div aria-live="polite">{content}</div>
      )}
    </div>
  );
};

export default HomeTicker;

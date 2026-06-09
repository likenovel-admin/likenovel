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
const NOTICE_LIST_PATH = "/product/customer-service/notice";

const fallbackItem: IHomeTickerItem = {
  type: "fallback",
  message: HOME_TICKER_FALLBACK_MESSAGE,
  productId: null,
  targetType: "none",
  targetId: null,
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

const splitTickerProductTitle = (message: string) => {
  const match = message.match(/^(.*?)<([^<>]+)>(.*)$/);
  if (!match) return null;

  return {
    prefix: match[1],
    title: match[2],
    suffix: match[3],
  };
};

const getFallbackTargetType = (item: IHomeTickerItem) => {
  if (item.productId) return "product";
  if (item.type === "new_notice") return "notice";
  return "none";
};

const getHomeTickerTargetPath = (item: IHomeTickerItem) => {
  const targetType = item.targetType || getFallbackTargetType(item);
  const targetId = item.targetId || item.productId;

  if (targetType === "product" && item.productId) {
    return buildProductDetailPath(item.productId);
  }

  if (targetType === "notice") {
    return targetId ? `${NOTICE_LIST_PATH}/${targetId}` : NOTICE_LIST_PATH;
  }

  return null;
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
  const targetPath = getHomeTickerTargetPath(activeItem);
  const isClickable = targetPath !== null;
  const messageRollClassName = prefersReducedMotion
    ? ""
    : "home-ticker-message-roll";
  const productTitleParts = splitTickerProductTitle(activeItem.message);

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
    if (!targetPath) return;

    if (activeItem.productId) {
      setPendingProductDetailEntrySource(
        activeItem.productId,
        PRODUCT_DETAIL_ENTRY_SOURCE.HOME_TICKER
      );
    }
    router.push(targetPath);
  };

  const content = (
    <div className="home-ticker-surface">
      <span className="home-ticker-live-badge">
        <span className="home-ticker-live-dot" aria-hidden="true" />
        LIVE
      </span>
      <span className="home-ticker-message-viewport">
        <span
          key={`home-ticker-${activeIndex}-${activeItem.message}`}
          className={`block truncate text-12pxr font-semibold leading-[18px] md:text-17pxr md:leading-[24px] ${messageRollClassName}`}
        >
          {productTitleParts ? (
            <>
              {productTitleParts.prefix}
              {"<"}
              <span className="inline-block max-w-[clamp(70px,28vw,140px)] overflow-hidden text-ellipsis whitespace-nowrap align-bottom md:max-w-none">
                {productTitleParts.title}
              </span>
              {">"}
              {productTitleParts.suffix}
            </>
          ) : (
            activeItem.message
          )}
        </span>
      </span>
    </div>
  );

  return (
    <div data-home-ticker className="w-full px-16pxr md:px-0 md:mt-20pxr md:mb-28pxr">
      {isClickable ? (
        <button
          type="button"
          onClick={handleClick}
          className="block w-full text-left transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-100"
          aria-label={`${activeItem.message} 자세히 보기`}
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

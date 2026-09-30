"use client";

import { useGetNoticeTopBar } from "@/app/api/query/notice";
import {
  TOP_NOTICE_BAR_CSS_VAR,
  TOP_NOTICE_BAR_DISMISS_STORAGE_KEY,
  TOP_NOTICE_BAR_HEIGHT_PX,
  addDismissedTopNoticeBarToken,
  buildTopNoticeBarDismissToken,
  buildTopNoticeBarHref,
  isTopNoticeBarHiddenOnPath,
  parseDismissedTopNoticeBarTokens,
  resolveTopNoticeBar,
} from "@/utils/topNoticeBar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useState } from "react";

const readStorage = (key: string) => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    // 저장소를 못 쓰는 환경에서는 저장값 없이 동작한다.
    console.warn("top notice bar: localStorage unavailable", error);
    return null;
  }
};

const writeStorage = (key: string, value: string | null) => {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch (error) {
    console.warn("top notice bar: failed to write localStorage", error);
  }
};

const TopNoticeBar = () => {
  const pathname = usePathname();
  const hiddenOnPath = isTopNoticeBarHiddenOnPath(pathname);
  const { data, isError } = useGetNoticeTopBar(!hiddenOnPath);
  const [dismissedTokens, setDismissedTokens] = useState<string[]>(() =>
    parseDismissedTopNoticeBarTokens(readStorage(TOP_NOTICE_BAR_DISMISS_STORAGE_KEY))
  );
  // 서버 응답으로 확인된 띠만 보여준다. 해제된 띠가 캐시로 잠깐이라도 다시 보이지 않게 한다.
  const bar = resolveTopNoticeBar({ data, isError, now: Date.now() });

  const isVisible = Boolean(
    bar
      && !hiddenOnPath
      && !dismissedTokens.includes(buildTopNoticeBarDismissToken(bar))
  );

  // 그리기 전에 헤더/본문 오프셋을 맞춰 헤더가 띠를 덮는 순간이 없게 한다.
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.style.setProperty(
      TOP_NOTICE_BAR_CSS_VAR,
      isVisible ? `${TOP_NOTICE_BAR_HEIGHT_PX}px` : "0px"
    );
    return () => {
      root.style.setProperty(TOP_NOTICE_BAR_CSS_VAR, "0px");
    };
  }, [isVisible]);

  if (!isVisible || !bar) return null;

  const handleDismiss = () => {
    const next = addDismissedTopNoticeBarToken(
      dismissedTokens,
      buildTopNoticeBarDismissToken(bar)
    );
    setDismissedTokens(next);
    writeStorage(TOP_NOTICE_BAR_DISMISS_STORAGE_KEY, JSON.stringify(next));
  };

  return (
    <div
      role="region"
      aria-label="사이트 공지"
      className="fixed left-0 top-0 z-[49] w-full bg-primary-100 text-white"
      style={{ height: TOP_NOTICE_BAR_HEIGHT_PX }}
    >
      <Link
        href={buildTopNoticeBarHref(bar.noticeId)}
        className="flex h-full w-full items-center justify-center px-44pxr text-13pxr font-medium md:text-14pxr hover:bg-primary-200 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
      >
        <span className="min-w-0 truncate">{bar.text}</span>
      </Link>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="상단 공지 닫기"
        className="absolute right-8pxr top-1/2 flex h-28pxr w-28pxr -translate-y-1/2 items-center justify-center rounded-full text-white/80 hover:bg-white/15 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white md:right-24pxr"
      >
        <svg aria-hidden width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
};

export default TopNoticeBar;

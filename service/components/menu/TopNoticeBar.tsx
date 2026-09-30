"use client";

import { useGetNoticeTopBar } from "@/app/api/query/notice";
import {
  TOP_NOTICE_BAR_CSS_VAR,
  TOP_NOTICE_BAR_DISMISS_STORAGE_KEY,
  TOP_NOTICE_BAR_HEIGHT_PX,
  buildTopNoticeBarDismissToken,
  buildTopNoticeBarHref,
  isTopNoticeBarHiddenOnPath,
} from "@/utils/topNoticeBar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const readDismissedToken = () => {
  try {
    return window.localStorage.getItem(TOP_NOTICE_BAR_DISMISS_STORAGE_KEY);
  } catch (error) {
    // 저장소를 못 쓰는 환경에서는 띠를 계속 보여준다.
    console.warn("top notice bar: localStorage unavailable", error);
    return null;
  }
};

const TopNoticeBar = () => {
  const pathname = usePathname();
  const hiddenOnPath = isTopNoticeBarHiddenOnPath(pathname);
  const { data } = useGetNoticeTopBar(!hiddenOnPath);
  const bar = data?.data ?? null;
  const [dismissedToken, setDismissedToken] = useState<string | null>(null);
  const [isStorageRead, setIsStorageRead] = useState(false);

  useEffect(() => {
    setDismissedToken(readDismissedToken());
    setIsStorageRead(true);
  }, []);

  const isVisible = Boolean(
    bar
      && isStorageRead
      && !hiddenOnPath
      && dismissedToken !== buildTopNoticeBarDismissToken(bar)
  );

  useEffect(() => {
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
    const token = buildTopNoticeBarDismissToken(bar);
    setDismissedToken(token);
    try {
      window.localStorage.setItem(TOP_NOTICE_BAR_DISMISS_STORAGE_KEY, token);
    } catch (error) {
      console.warn("top notice bar: failed to remember dismissal", error);
    }
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

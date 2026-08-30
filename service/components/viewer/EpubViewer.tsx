import { usePostAiSignalEvent } from "@/app/api/query/recommendation";
import Spinner from "@/components/common/Spinner";
import { DEFAULT_PRODUCT_IMAGE } from "@/constants/common";
import LastPage from "@/components/viewer/LastPage";
import useMediaDevice from "@/hooks/useMediaDevice";
import useAuthStore from "@/store/authStore";
import useViewStore from "@/store/viewerStore";
import {
  createInitialScrolledBodyCoordinator,
  createInitialScrolledBodyViewAttacher,
  type InitialScrolledBodyAttemptResult,
  type InitialScrolledBodyCoordinator,
  type InitialScrolledBodyViewAttacher,
} from "@/utils/initialScrolledBodyCoordinator";
import {
  clearReaderFunnelViewerSession,
  getReaderFunnelActiveMs,
  isReaderFunnelEpisodeComplete,
  pauseReaderFunnelActiveWindow,
  postReaderFunnelEventBestEffort,
  registerReaderFunnelViewerSession,
  resolveReaderFunnelLane,
  resumeReaderFunnelActiveWindow,
  type ReaderFunnelLane,
} from "@/utils/readerFunnelSignal";
import {
  createSiteAnalyticsEventId,
  getSiteAnalyticsIdentity,
} from "@/utils/siteAnalyticsIdentity";
import {
  resolveViewerAppearance,
  VIEWER_DESKTOP_PAGINATED_WIDTHS,
  VIEWER_MOBILE_PAGINATED_WIDTHS,
} from "@/utils/viewerAppearance";
import type { Contents, Rendition } from "epubjs";
import type React from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ReactReader, ReactReaderStyle } from "react-reader";
import ArrowLeft from "/public/images/arrow-left.svg";
import ArrowRight from "/public/images/arrow-right.svg";

const BROKEN_IMAGE_SRC_SENTINELS = new Set(["none", "null", "undefined"]);
const COVER_IMAGE_SELECTORS =
  'img[src*="cover"], img[alt*="cover"], img[alt*="표지"], img[class*="cover"], .cover-image, .titlepage img, .frontcover img';
const SLOW_CONNECTION_TYPES = new Set(["slow-2g", "2g"]);

interface ArrowIconProps {
  direction: "left" | "right";
  color: string;
  onClick: (e: React.MouseEvent) => void;
}

const ArrowIcon = memo(({ direction, color, onClick }: ArrowIconProps) => {
  return (
    <button onClick={onClick} className="z-10 py-10">
      {direction === "left" ? (
        <ArrowLeft
          color={color}
          className="w-[10px] h-[20px] md:w-[20px] md:h-[30px]"
        />
      ) : (
        <ArrowRight
          color={color}
          className="w-[10px] h-[20px] md:w-[20px] md:h-[30px]"
        />
      )}
    </button>
  );
});
ArrowIcon.displayName = "ArrowIcon";

interface Props {
  epubUrl: string;
  coverImagePath?: string | null;
  isScroll: boolean;
  location: string | number;
  setLocation: (location: string | number) => void;
  goFirstRequest?: number;
  showNav: boolean;
  setShowNav: React.Dispatch<React.SetStateAction<boolean>>;
  suppressViewerClickTick?: number;
  readerPaused?: boolean;
  handleCommentState: () => void;
  currentEpisodeId?: number;
  productId?: number;
  nextEpisodeId?: number;
}

const EpubViewer = ({
  epubUrl,
  coverImagePath,
  isScroll,
  location,
  setLocation,
  goFirstRequest = 0,
  showNav,
  setShowNav,
  suppressViewerClickTick = 0,
  readerPaused = false,
  currentEpisodeId,
  productId,
  nextEpisodeId,
  handleCommentState,
}: Props) => {
  const { settings, setSettings } = useViewStore((state) => ({
    settings: state.settings,
    setSettings: state.setSettings,
  }));

  const [showLastPage, setShowLastPage] = useState(false);
  const [atBookEnd, setAtBookEnd] = useState(false);
  const [iconColor, setIconColor] = useState("var(--foreground-rgb)");
  const [progress, setProgress] = useState(0);
  const [epubReady, setEpubReady] = useState(false);
  const [readerFunnelLane, setReaderFunnelLane] =
    useState<ReaderFunnelLane | null>(null);
  const resolvedCoverImagePath = (coverImagePath || DEFAULT_PRODUCT_IMAGE).trim();

  const renditionRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef(settings);
  const showLastPageRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastResizeDimensionsRef = useRef({ width: 0, height: 0 });
  const skippedInitialMobileCoverRef = useRef(false);
  const pendingScrollRestoreTopRef = useRef<number | null>(null);
  const suppressNavToggleUntilRef = useRef(0);
  const scrolledContainerTopPaddingRef = useRef<number | null>(null);

  // Scrolled mode: host element at the end of EPUB scroll container
  const lastPageHostRef = useRef<HTMLElement | null>(null);
  const epubReadyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const epubReadyDoneRef = useRef(false);
  const initialScrolledBodyCoordinatorRef =
    useRef<InitialScrolledBodyCoordinator | null>(null);
  const coverPreloadImageRef = useRef<HTMLImageElement | null>(null);

  const device = useMediaDevice();
  const { isAuthInitialized, isAuthenticated } = useAuthStore((s) => ({
    isAuthInitialized: s.isAuthInitialized,
    isAuthenticated: s.isAuthenticated,
  }));

  // Track when the LastPage host DOM node has been created
  // This is used to re-run the touch binding effect when the host actually exists.
  const [lastPageHostReady, setLastPageHostReady] = useState(false);

  // ========================= AI SIGNAL EVENTS =========================

  const { mutate: postSignalEvent } = usePostAiSignalEvent();

  const sessionIdRef = useRef(createSiteAnalyticsEventId());
  const activeSecondsRef = useRef(0);
  const progressRef = useRef(0);
  const episodeViewFiredRef = useRef(false);
  const episodeEndFiredRef = useRef(false);
  const latestReachedFiredRef = useRef(false);
  const lastExitTimeRef = useRef(0);
  const readerStartEventIdRef = useRef(createSiteAnalyticsEventId());
  const readerCompleteEventIdRef = useRef(createSiteAnalyticsEventId());
  const readerExitEventIdRef = useRef(createSiteAnalyticsEventId());
  const readerCompleteFiredRef = useRef(false);
  const readerActiveTimingRef = useRef({
    accumulatedMs: 0,
    visibleStartedAt: null as number | null,
  });
  const readerPausedRef = useRef(readerPaused);

  useEffect(() => { progressRef.current = progress; }, [progress]);

  useEffect(() => {
    readerPausedRef.current = readerPaused;
    const now = Date.now();
    if (readerPaused) {
      pauseReaderFunnelActiveWindow(readerActiveTimingRef.current, now);
    } else if (document.visibilityState === "visible") {
      resumeReaderFunnelActiveWindow(readerActiveTimingRef.current, now);
    }
  }, [readerPaused]);

  useEffect(() => {
    if (
      !epubReady ||
      !isAuthInitialized ||
      readerFunnelLane ||
      !productId ||
      !currentEpisodeId
    ) {
      return;
    }
    setReaderFunnelLane(resolveReaderFunnelLane(isAuthenticated));
  }, [
    currentEpisodeId,
    epubReady,
    isAuthInitialized,
    isAuthenticated,
    productId,
    readerFunnelLane,
  ]);

  useEffect(() => {
    if (
      !readerFunnelLane ||
      !productId ||
      !currentEpisodeId
    ) {
      return;
    }

    const identity = getSiteAnalyticsIdentity();
    const viewerSessionId = sessionIdRef.current;
    const now = Date.now();
    readerActiveTimingRef.current = {
      accumulatedMs: 0,
      visibleStartedAt:
        document.visibilityState === "visible" && !readerPausedRef.current
          ? now
          : null,
    };
    registerReaderFunnelViewerSession({
      episodeId: currentEpisodeId,
      viewerSessionId,
      lane: readerFunnelLane,
      ...identity,
    });

    if (readerFunnelLane === "guest") {
      postReaderFunnelEventBestEffort({
        eventId: readerStartEventIdRef.current,
        occurredAt: new Date(now).toISOString(),
        ...identity,
        viewerSessionId,
        productId,
        episodeId: currentEpisodeId,
        eventType: "episode_start",
        activeMs: 0,
        progressRatio: 0,
      });
    }

    const handleVisibilityChange = () => {
      const visibilityNow = Date.now();
      if (document.visibilityState === "hidden") {
        pauseReaderFunnelActiveWindow(
          readerActiveTimingRef.current,
          visibilityNow
        );
        sendGuestExit();
        return;
      }
      if (!readerPausedRef.current) {
        resumeReaderFunnelActiveWindow(
          readerActiveTimingRef.current,
          visibilityNow
        );
      }
    };
    const sendGuestExit = () => {
      if (readerFunnelLane !== "guest") return;
      postReaderFunnelEventBestEffort({
        eventId: readerExitEventIdRef.current,
        occurredAt: new Date().toISOString(),
        ...identity,
        viewerSessionId,
        productId,
        episodeId: currentEpisodeId,
        eventType: "episode_exit",
        activeMs: getReaderFunnelActiveMs(
          readerActiveTimingRef.current,
          Date.now()
        ),
        progressRatio: Math.min(Math.max(progressRef.current / 100, 0), 1),
      });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", sendGuestExit);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", sendGuestExit);
      sendGuestExit();
      clearReaderFunnelViewerSession(
        currentEpisodeId,
        viewerSessionId
      );
    };
  }, [
    currentEpisodeId,
    productId,
    readerFunnelLane,
  ]);

  // Active reading time — only counts while epub is ready and tab is visible
  useEffect(() => {
    if (!epubReady || readerPaused) return;

    let timer: NodeJS.Timeout | null = setInterval(() => { activeSecondsRef.current += 1; }, 1000);

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (timer) { clearInterval(timer); timer = null; }
      } else {
        if (!timer) { timer = setInterval(() => { activeSecondsRef.current += 1; }, 1000); }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [epubReady, readerPaused]);

  useEffect(() => {
    if (!epubReady || !isScroll || !settings.hideImageCover) return;
    if (!resolvedCoverImagePath) return;

    const connection = (
      navigator as Navigator & {
        connection?: { effectiveType?: string; saveData?: boolean };
      }
    ).connection;
    if (
      connection?.saveData ||
      (connection?.effectiveType &&
        SLOW_CONNECTION_TYPES.has(connection.effectiveType))
    ) {
      return;
    }

    let cancelled = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
    let idleCallbackId: number | null = null;

    const preloadCover = () => {
      if (cancelled) return;
      const image = new window.Image();
      coverPreloadImageRef.current = image;
      image.src = resolvedCoverImagePath;
      image.decode?.().catch(() => {
        // best-effort preload only
      });
    };

    if ("requestIdleCallback" in window) {
      idleCallbackId = window.requestIdleCallback(preloadCover, {
        timeout: 2500,
      });
    } else {
      fallbackTimer = setTimeout(preloadCover, 1200);
    }

    return () => {
      cancelled = true;
      if (idleCallbackId !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleCallbackId);
      }
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
      }
    };
  }, [epubReady, isScroll, resolvedCoverImagePath, settings.hideImageCover]);

  const buildSignalBody = useCallback(
    (
      eventType: string,
      extraPayload?: Record<string, unknown>
    ) => {
      const hasNext = nextEpisodeId !== undefined && nextEpisodeId > 0;
      return {
        product_id: productId!,
        episode_id: currentEpisodeId,
        event_type: eventType,
        session_id: sessionIdRef.current,
        active_seconds: activeSecondsRef.current,
        progress_ratio: Math.min(progressRef.current / 100, 1),
        next_available_yn: (hasNext ? "Y" : "N") as "Y" | "N",
        latest_episode_reached_yn: (!hasNext ? "Y" : "N") as "Y" | "N",
        ...(extraPayload ? { event_payload: extraPayload } : {}),
      };
    },
    [productId, currentEpisodeId, nextEpisodeId]
  );

  // 1) episode_view — fire once when epub loads
  useEffect(() => {
    if (epubReady && productId && readerFunnelLane === "member" && !episodeViewFiredRef.current) {
      episodeViewFiredRef.current = true;
      postSignalEvent(buildSignalBody("episode_view"));
    }
  }, [epubReady, productId, readerFunnelLane, buildSignalBody, postSignalEvent]);

  // 2) episode_end — fire once when progress >= 95%
  useEffect(() => {
    if (progress >= 95 && productId && readerFunnelLane === "member" && !episodeEndFiredRef.current) {
      episodeEndFiredRef.current = true;
      postSignalEvent(buildSignalBody("episode_end"));
    }
  }, [progress, productId, readerFunnelLane, buildSignalBody, postSignalEvent]);

  useEffect(() => {
    if (
      !isReaderFunnelEpisodeComplete(progress) ||
      !productId ||
      !currentEpisodeId ||
      readerFunnelLane !== "guest" ||
      readerCompleteFiredRef.current
    ) {
      return;
    }
    readerCompleteFiredRef.current = true;
    const identity = getSiteAnalyticsIdentity();
    postReaderFunnelEventBestEffort({
      eventId: readerCompleteEventIdRef.current,
      occurredAt: new Date().toISOString(),
      ...identity,
      viewerSessionId: sessionIdRef.current,
      productId,
      episodeId: currentEpisodeId,
      eventType: "episode_complete",
      activeMs: getReaderFunnelActiveMs(
        readerActiveTimingRef.current,
        Date.now()
      ),
      progressRatio: Math.min(Math.max(progress / 100, 0), 1),
    });
  }, [currentEpisodeId, productId, progress, readerFunnelLane]);

  // 3) latest_episode_reached — 최신화 열람 도달 신호 (완독 의미 아님, 최신화를 열었다는 사실)
  useEffect(() => {
    if (epubReady && productId && readerFunnelLane === "member" && nextEpisodeId === 0 && !latestReachedFiredRef.current) {
      latestReachedFiredRef.current = true;
      postSignalEvent(buildSignalBody("latest_episode_reached"));
    }
  }, [epubReady, productId, readerFunnelLane, nextEpisodeId, buildSignalBody, postSignalEvent]);

  // 4) Exit progress — capture progress_ratio on page leave
  useEffect(() => {
    if (!productId || readerFunnelLane !== "member") return;

    const sendExitEvent = () => {
      const now = Date.now();
      if (now - lastExitTimeRef.current < 2000) return;
      lastExitTimeRef.current = now;
      if (activeSecondsRef.current < 3) return;
      const body = buildSignalBody("episode_view", { trigger: "exit" });
      const token =
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token");
      try {
        fetch("/api/v1/command/ai/signal-events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(body),
          keepalive: true,
        });
      } catch {
        // best-effort — page is closing
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        sendExitEvent();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", sendExitEvent);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", sendExitEvent);
      sendExitEvent();
    };
  }, [productId, readerFunnelLane, buildSignalBody]);

  // ========================= RESIZE (SCROLLED) =========================

  const debouncedResize = useCallback(
    (rendition: any, width: number, height: number) => {
      if (
        lastResizeDimensionsRef.current.width === width &&
        lastResizeDimensionsRef.current.height === height
      ) {
        return;
      }
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(() => {
        if (rendition && width > 0 && height > 0) {
          lastResizeDimensionsRef.current = { width, height };
          rendition.resize(width, height);
        }
      }, 150);
    },
    []
  );

  const marginSizeMap =
    device === "mobile"
      ? VIEWER_MOBILE_PAGINATED_WIDTHS
      : VIEWER_DESKTOP_PAGINATED_WIDTHS;

  const epubOptions = useMemo(
    () =>
      isScroll
        ? { flow: "scrolled", manager: "continuous" }
        : {
            flow: "paginated",
            manager: "default",
            spread: device === "mobile" ? "none" : "auto",
          },
    [isScroll, device]
  );

  // Reset when switching modes
  useEffect(() => {
    setAtBookEnd(false);
    setShowLastPage(false);
    setEpubReady(false);
    epubReadyDoneRef.current = false;
    showLastPageRef.current = false;
    lastResizeDimensionsRef.current = { width: 0, height: 0 };
    if (epubReadyTimerRef.current) {
      clearTimeout(epubReadyTimerRef.current);
      epubReadyTimerRef.current = null;
    }
    setLastPageHostReady(false);

    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = null;
    }
    // Remove scrolled host when leaving scrolled mode
    if (!isScroll && lastPageHostRef.current?.parentElement) {
      lastPageHostRef.current.parentElement.removeChild(
        lastPageHostRef.current
      );
      lastPageHostRef.current = null;
    }
  }, [isScroll]);

  // Cleanup on unmount / URL change
  useEffect(() => {
    return () => {
      initialScrolledBodyCoordinatorRef.current?.cancel();
      initialScrolledBodyCoordinatorRef.current = null;
      if (renditionRef.current) {
        try {
          renditionRef.current.destroy();
        } catch {
          // ignore
        }
        renditionRef.current = null;
      }
      if (lastPageHostRef.current?.parentElement) {
        lastPageHostRef.current.parentElement.removeChild(
          lastPageHostRef.current
        );
      }
      lastPageHostRef.current = null;
      if (epubReadyTimerRef.current) {
        clearTimeout(epubReadyTimerRef.current);
        epubReadyTimerRef.current = null;
      }
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
        resizeTimeoutRef.current = null;
      }
    };
  }, [epubUrl]);

  // ========================= PROGRESS =========================

  const updateProgress = useCallback(() => {
    if (renditionRef.current && renditionRef.current.location?.start) {
      const displayed = renditionRef.current.location.start.displayed;
      const flow = renditionRef.current.settings.flow;
      if (displayed?.total >= 5) {
        if (flow === "paginated") {
          const newProgress = Math.floor(
            (displayed.page / (displayed.total - 2)) * 100
          );
          setProgress(newProgress);
        } else if (flow === "scrolled") {
          const newProgress = Math.floor(
            (displayed.page / displayed.total) * 100
          );
          setProgress(newProgress);
        }
      } else {
        setProgress(0);
      }
    } else {
      setProgress(0);
    }
  }, []);

  const isAtStart =
    location === 0 || location === "epubcfi(/6/2!/4/1:0)" || !location;

  const leftArrowColor = useMemo(() => {
    if (isAtStart) {
      return "#9EA4AF";
    } else if (settings.theme === "dark") {
      return "var(--dark-theme-content)";
    } else {
      return "var(--foreground-rgb)";
    }
  }, [isAtStart, settings.theme]);

  const viewerAppearance = useMemo(
    () => resolveViewerAppearance(settings),
    [settings]
  );
  const bgColor = viewerAppearance.backgroundColor;
  const bgColorRef = useRef(bgColor);
  const contentTextColor = viewerAppearance.textColor;
  const contentTextColorRef = useRef(contentTextColor);

  useEffect(() => {
    settingsRef.current = settings;
    bgColorRef.current = bgColor;
    contentTextColorRef.current = contentTextColor;
  }, [settings, bgColor, contentTextColor]);

  const goToPrevPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTransitioningRef.current) return;

    // Paginated: if on LastPage, just hide it
    if (!isScroll && showLastPage) {
      isTransitioningRef.current = true;
      showLastPageRef.current = false;
      setShowLastPage(false);
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 300);
      return;
    }

    if (renditionRef.current) {
      isTransitioningRef.current = true;
      showLastPageRef.current = false;
      setShowLastPage(false);
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 300);
      renditionRef.current.prev();
    }
  };

  const goToNextPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTransitioningRef.current || showLastPageRef.current) return;

    const r = renditionRef.current;
    if (!r) return;

    // Paginated: show LastPage when reaching the end
    const isEndReached = !isScroll && (atBookEnd || progress >= 99);

    if (isEndReached) {
      isTransitioningRef.current = true;
      showLastPageRef.current = true;
      setShowLastPage(true);
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 300);
      return;
    }

    r.next();
  };

  const handleToggleNav = () => {
    setShowNav((prev: boolean) => !prev);
  };

  useEffect(() => {
    if (suppressViewerClickTick <= 0) return;
    suppressNavToggleUntilRef.current = Date.now() + 500;
  }, [suppressViewerClickTick]);

  // ========================= COVER TOGGLE =========================

  const updateToggleButtons = useCallback(() => {
    if (!renditionRef.current) return;
    const contents = renditionRef.current.getContents();
    contents.forEach((content: Contents) => {
      const doc = content.window?.document;
      if (!doc) return;

      const coverImages = Array.from(
        doc.querySelectorAll(COVER_IMAGE_SELECTORS)
      );
      const docTitle = (doc.title || "").toLowerCase();

      // 빈 src 이미지 감지 (벌크 업로드 등으로 깨진 표지)
      const brokenCoverImgs = docTitle.includes("cover")
        ? Array.from(doc.querySelectorAll("img")).filter(
            (img) => {
              const normalizedSrc = (img.getAttribute("src") || "")
                .trim()
                .toLowerCase();
              return (
                normalizedSrc === "" ||
                BROKEN_IMAGE_SRC_SENTINELS.has(normalizedSrc)
              );
            }
          )
        : [];

      let coverCandidates = coverImages.length > 0
        ? (coverImages as HTMLElement[])
        : (brokenCoverImgs as HTMLElement[]);

      coverCandidates.forEach((img) => {
        const imgEl = img as HTMLElement;
        const attrSrc = (imgEl.getAttribute("src") || "").toLowerCase();
        const altText = (imgEl.getAttribute("alt") || "").toLowerCase();
        const classText = (imgEl.getAttribute("class") || "").toLowerCase();
        const isExplicitCoverContext =
          docTitle.includes("cover") ||
          attrSrc.includes("cover") ||
          altText.includes("cover") ||
          altText.includes("표지") ||
          classText.includes("cover");
        // cross-frame: iframe 내부 요소는 메인 윈도우의 HTMLImageElement와 다른 생성자이므로
        // instanceof 대신 tagName으로 체크
        if (
          resolvedCoverImagePath &&
          isExplicitCoverContext &&
          imgEl.tagName === 'IMG' &&
          (imgEl as HTMLImageElement).src !== resolvedCoverImagePath
        ) {
          (imgEl as HTMLImageElement).src = resolvedCoverImagePath;
        }

        img.parentElement
          ?.querySelectorAll<HTMLButtonElement>(".epub-cover-toggle")
          .forEach((button) => button.remove());

        if (isScroll) {
          imgEl.style.display = settingsRef.current.hideImageCover
            ? "none"
            : "block";
          imgEl.style.visibility = "visible";
          imgEl.style.margin = "0 auto";
          imgEl.style.maxWidth = "100%";
          imgEl.style.height = "auto";
          if (imgEl.parentElement) {
            imgEl.parentElement.style.textAlign = "center";
          }
        } else {
          imgEl.style.display = "";
          imgEl.style.visibility = "";
          imgEl.style.margin = "";
          imgEl.style.maxWidth = "";
          imgEl.style.height = "";
          if (imgEl.parentElement) {
            imgEl.parentElement.style.textAlign = "";
          }
        }

      });

      doc.body.removeAttribute("data-cover-toggle-setup");
    });
  }, [isScroll, resolvedCoverImagePath]);

  const createInitialScrolledBodyAttachmentAttempt = useCallback(
    (rendition: Rendition) => {
      let bodyViewAttacher: InitialScrolledBodyViewAttacher | null = null;

      return (): InitialScrolledBodyAttemptResult => {
        const book = (rendition as any).book;
        const manager = (rendition as any).manager;
        if (!book || !manager?.views) return "waiting";

        try {
          const spine = book.spine;
          const getSection = (index: number) =>
            typeof spine?.get === "function"
              ? spine.get(index)
              : Array.isArray(spine?.spineItems)
                ? spine.spineItems[index]
                : Array.isArray(spine?.items)
                  ? spine.items[index]
                  : null;
          const firstSection = getSection(0);
          const firstSpineMarker = [
            firstSection?.href,
            firstSection?.canonical,
            firstSection?.idref,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!firstSpineMarker.includes("cover")) return "complete";

          const bodySection = getSection(1);
          if (!bodySection) return "failed";

          const isMatchingSection = (view: any, section: any) => {
            const viewSection = view?.section;
            return (
              viewSection === section ||
              (typeof viewSection?.index === "number" &&
                viewSection.index === section.index) ||
              (viewSection?.href && viewSection.href === section.href) ||
              (viewSection?.idref && viewSection.idref === section.idref)
            );
          };
          const views = manager.views.all?.() || [];
          const coverView = views.find((view: any) =>
            isMatchingSection(view, firstSection)
          );

          const displayView = (view: any, label: "cover" | "body") => {
            if (!view) return;
            if (view.displayed) {
              view.show?.();
              return;
            }
            if (typeof view.display !== "function") return;

            void Promise.resolve(view.display(manager.request))
              .then(() => view.show?.())
              .catch((error) => {
                console.warn(`[viewer] initial ${label} display failed`, error);
              });
          };

          if (!settingsRef.current.hideImageCover && !coverView) {
            try {
              const appendedCover =
                manager.append(firstSection) || manager.views.last?.();
              displayView(appendedCover, "cover");
            } catch (error) {
              console.warn("[viewer] initial cover attachment failed", error);
            }
          }

          if (!bodyViewAttacher) {
            bodyViewAttacher = createInitialScrolledBodyViewAttacher({
              findBodyView: () =>
                (manager.views.all?.() || []).find((view: any) =>
                  isMatchingSection(view, bodySection)
                ),
              appendBodyView: () =>
                manager.append(bodySection) || manager.views.last?.(),
              request: manager.request,
              onDisplayError: (error, attempt) => {
                console.warn(
                  `[viewer] initial body display failed (attempt ${attempt})`,
                  error
                );
              },
            });
          }
          return bodyViewAttacher.attempt();
        } catch (error) {
          console.warn("[viewer] initial body attachment failed", error);
          return "failed";
        }
      };
    },
    []
  );

  const isInitialMobileCoverVisible = useCallback((rendition?: Rendition | null) => {
    if (device !== "mobile" || isScroll) {
      return false;
    }

    const currentRendition = rendition ?? renditionRef.current;
    const currentIndex = currentRendition?.location?.start?.index;
    if (currentIndex !== 0) {
      return false;
    }

    const contents = currentRendition?.getContents?.();
    if (!Array.isArray(contents) || contents.length === 0) {
      return false;
    }

    return contents.some((content: Contents) => {
      const doc = (content as any).document || content.window?.document;
      return Boolean(doc?.querySelector(COVER_IMAGE_SELECTORS));
    });
  }, [device, isScroll]);

  const lockContentSelection = useCallback((doc: Document) => {
    const docWithSelectionLock = doc as Document & {
      __likenovelSelectionLocked?: boolean;
    };

    doc.documentElement.style.setProperty("user-select", "none", "important");
    doc.documentElement.style.setProperty("-webkit-user-select", "none", "important");
    doc.documentElement.style.setProperty("-webkit-touch-callout", "none", "important");
    doc.body.style.setProperty("user-select", "none", "important");
    doc.body.style.setProperty("-webkit-user-select", "none", "important");
    doc.body.style.setProperty("-webkit-touch-callout", "none", "important");

    doc.querySelectorAll("body *").forEach((element) => {
      const htmlElement = element as HTMLElement;
      htmlElement.style.setProperty("user-select", "none", "important");
      htmlElement.style.setProperty("-webkit-user-select", "none", "important");
      htmlElement.style.setProperty("-webkit-touch-callout", "none", "important");
    });

    doc.defaultView?.getSelection?.()?.removeAllRanges();

    if (docWithSelectionLock.__likenovelSelectionLocked) {
      return;
    }

    const preventSelection = (event: Event) => {
      event.preventDefault();
    };

    doc.addEventListener("selectstart", preventSelection);
    doc.addEventListener("dragstart", preventSelection);
    docWithSelectionLock.__likenovelSelectionLocked = true;
  }, []);

  // ========================= THEME =========================

  const updateTheme = useCallback(
    (rendition: Rendition) => {
      const themes = rendition.themes;
      const currentSettings = settingsRef.current;
      const currentBgColor = bgColorRef.current;
      const currentContentTextColor = contentTextColorRef.current;
      const currentAppearance = resolveViewerAppearance(currentSettings);

      themes.override("font-family", currentAppearance.fontFamily);

      themes.override("background-color", currentBgColor);
      themes.override("color", currentContentTextColor);

      const fontSize = currentAppearance.fontSize;
      if (fontSize) {
        themes.override("font-size", fontSize);
      }

      const letterSpacing = currentAppearance.letterSpacing;
      if (letterSpacing) {
        themes.override("letter-spacing", letterSpacing);
      }

      const lineHeight = currentAppearance.lineHeight;
      rendition.themes.default({
        p: {
          ...(lineHeight ? { "line-height": `${lineHeight} !important` } : {}),
          "tab-size": "4 !important",
          "margin": "0 0 0.15em 0 !important",
          "text-indent": currentSettings.useParagraphIndent
            ? "1em !important"
            : "0 !important",
        },
      });
      if (containerRef.current) {
        containerRef.current.style.backgroundColor = currentBgColor;
      }

      const marginSize = marginSizeMap[currentSettings.marginSize - 1];
      if (wrapperRef.current) {
        // EPUB 본문 영역 (wrapper의 첫 번째 자식)
        const epubArea = wrapperRef.current.querySelector<HTMLElement>('[style*="display"]') || wrapperRef.current.firstElementChild as HTMLElement | null;

        if (device === "mobile") {
          // 모바일: wrapper는 전체 폭 유지 (LastPage 보호)
          wrapperRef.current.style.removeProperty("width");
          wrapperRef.current.style.removeProperty("maxWidth");
          // EPUB 영역에만 max-width 적용
          if (epubArea && !isScroll) {
            if (isInitialMobileCoverVisible(rendition)) {
              epubArea.style.removeProperty("maxWidth");
              epubArea.style.removeProperty("margin");
            } else {
              const viewportW = window.innerWidth || 390;
              const gap = (currentSettings.marginSize - 1) * 40;
              const mobileMaxW = `${viewportW - gap}px`;
              epubArea.style.maxWidth = mobileMaxW;
              epubArea.style.margin = "0 auto";
            }
          }
        } else if (isScroll) {
          wrapperRef.current.style.removeProperty("width");
        } else if (marginSize) {
          wrapperRef.current.style.width = marginSize;
        }
      }


      const contents = rendition.getContents?.();
      if (!Array.isArray(contents)) {
        return;
      }
      contents.forEach((content: Contents) => {
        const doc =
          (content as any).document || content.window?.document;
        if (!doc) return;

        doc.documentElement.style.backgroundColor = currentBgColor;
        doc.documentElement.style.color = currentContentTextColor;
        doc.body.style.backgroundColor = currentBgColor;
        doc.body.style.color = currentContentTextColor;
        doc.body.style.setProperty("tab-size", "4", "important");
        lockContentSelection(doc);

        if (isScroll && device === "mobile") {
          // 모바일 세로보기: iframe 내부 body도 절대 px로 제한
          const viewportW = window.innerWidth || 390;
          const gap = (currentSettings.marginSize - 1) * 40;
          const mobileMaxW = `${viewportW - gap}px`;
          doc.body.style.setProperty("max-width", mobileMaxW, "important");
          doc.body.style.setProperty("margin", "0 auto", "important");
        } else if (isScroll && device !== "mobile") {
          const maxWidth = currentAppearance.desktopScrolledMaxWidth;
          doc.body.style.setProperty("max-width", maxWidth, "important");
          doc.body.style.setProperty("margin", "0 auto", "important");
        } else {
          doc.body.style.removeProperty("max-width");
          doc.body.style.removeProperty("margin");
        }

        doc.querySelectorAll("p").forEach((paragraph: Element) => {
          const element = paragraph as HTMLElement;
          const normalizedText = (element.textContent || "")
            .replace(/\u00A0/g, "")
            .replace(/\u200B/g, "")
            .replace(/\uFEFF/g, "")
            .trim();
          const hasNonBrChild = Array.from(element.children).some(
            (child) => child.tagName !== "BR"
          );
          const isBlankParagraph =
            normalizedText === "" && !hasNonBrChild;

          element.style.setProperty("tab-size", "4", "important");
          element.style.setProperty(
            "margin",
            isBlankParagraph ? "0" : "0 0 0.15em 0",
            "important"
          );
          element.style.setProperty(
            "line-height",
            lineHeight || "inherit",
            "important"
          );
          if (isBlankParagraph) {
            element.style.setProperty(
              "min-height",
              lineHeight || "1.7em",
              "important"
            );
          } else {
            element.style.removeProperty("min-height");
          }
          element.style.setProperty(
            "text-indent",
            currentSettings.useParagraphIndent && !isBlankParagraph ? "1em" : "0",
            "important"
          );
        });
      });
    },
    [marginSizeMap, isScroll, device, lockContentSelection]
  );

  useEffect(() => {
    const color =
      settings.theme === "dark"
        ? "var(--dark-theme-content)"
        : "var(--foreground-rgb)";
    setIconColor(color);
  }, [settings.theme]);

  // Only re-apply theme when settings change
  useEffect(() => {
    if (renditionRef.current) {
      const rendition = renditionRef.current;
      const scrollContainer = isScroll
        ? (rendition as any)?.manager?.views?.container ||
          (rendition as any)?.manager?.container ||
          null
        : null;
      if (scrollContainer) {
        pendingScrollRestoreTopRef.current = scrollContainer.scrollTop;
      }
      try {
        updateTheme(rendition);
      } catch {
        // epubjs theme update may fail if rendition is stale
      }
      if (scrollContainer && pendingScrollRestoreTopRef.current !== null) {
        requestAnimationFrame(() => {
          const latestContainer =
            (rendition as any)?.manager?.views?.container ||
            (rendition as any)?.manager?.container ||
            null;
          if (!latestContainer || pendingScrollRestoreTopRef.current === null) {
            return;
          }
          latestContainer.scrollTop = pendingScrollRestoreTopRef.current;
        });
      }
    }
  }, [settings, updateTheme, isScroll]);

  // 모바일 여백 변경 시에만 rendition 재계산 + 위치 복원
  useEffect(() => {
    if (device !== "mobile" || isScroll || !renditionRef.current) return;
    const rendition = renditionRef.current;
    if (isInitialMobileCoverVisible(rendition)) {
      skippedInitialMobileCoverRef.current = true;
      return;
    }
    // rAF 2번: CSS maxWidth 적용 → 레이아웃 계산 → resize
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const currentCfi = rendition.location?.start?.cfi;
        const mgr = (rendition as any).manager;
        const container = mgr?.views?.container || mgr?.container;
        if (container) {
          const w = container.offsetWidth;
          const h = container.offsetHeight;
          if (w > 0 && h > 0) {
            try { rendition.resize(w, h); } catch {}
            if (currentCfi) {
              requestAnimationFrame(() => {
                try { rendition.display(currentCfi); } catch {}
              });
            }
          }
        }
      });
    });
  }, [device, isScroll, settings.marginSize, epubReady, isInitialMobileCoverVisible]);

  useEffect(() => {
    if (renditionRef.current) {
      updateToggleButtons();
    }
  }, [updateToggleButtons, isScroll, settings.hideImageCover]);

  // ========================= SCROLLED LastPage HOST =========================

  const getScrollContainer = () => {
    const r = renditionRef.current;
    return r?.manager?.views?.container || r?.manager?.container || null;
  };

  const syncScrolledContainerLayout = useCallback(
    (preserveViewport: boolean) => {
      if (!isScroll) return;

      const container = getScrollContainer();
      if (!container) return;

      const nextTopPadding = showNav ? 68 : 0;
      const nextBottomPadding = 120;
      const prevTopPadding = scrolledContainerTopPaddingRef.current;

      container.style.paddingTop = `${nextTopPadding}px`;
      container.style.paddingBottom = `${nextBottomPadding}px`;

      if (
        preserveViewport &&
        prevTopPadding !== null &&
        prevTopPadding !== nextTopPadding
      ) {
        container.scrollTop += nextTopPadding - prevTopPadding;
      }

      scrolledContainerTopPaddingRef.current = nextTopPadding;
    },
    [isScroll, showNav]
  );

  // Keep LastPage host at the end of the EPUB scroll container
  const placeHostAtEnd = useCallback(() => {
    if (!isScroll) return;
    const container = getScrollContainer();
    if (!container) return;

    let host = lastPageHostRef.current;

    if (!host) {
      // Host is created only once here
      host = document.createElement("div");
      host.id = "epub-lastpage-host";
      host.style.width = "100%";
      host.style.boxSizing = "border-box";
      host.style.padding = "48px 0 64px";
      // Ensure touch gestures are interpreted as vertical scroll on mobile
      host.style.touchAction = "auto";
      host.style.overflowY = "visible";
      host.style.minHeight = "100vh";
      lastPageHostRef.current = host;
      container.appendChild(host);

      // Notify that host is ready so touch handlers can be attached
      setLastPageHostReady(true);
      return;
    }

    if (
      host.parentElement !== container ||
      container.lastElementChild !== host
    ) {
      container.appendChild(host);
    }
  }, [isScroll]);

  const restoreVisibleRendition = useCallback(() => {
    const rendition = renditionRef.current;
    const wrapper = wrapperRef.current;
    if (!rendition || !wrapper) return;

    const width = wrapper.offsetWidth;
    const height = wrapper.offsetHeight;
    if (width <= 0 || height <= 0) return;

    try {
      lastResizeDimensionsRef.current = { width: 0, height: 0 };
      rendition.resize(width, height);
    } catch {
      return;
    }

    const targetLocation =
      rendition.location?.start?.cfi ??
      (typeof location === "string" ? location : location || 0);

    requestAnimationFrame(() => {
      try {
        rendition.display(targetLocation);
      } catch {
        // keep current frame if display restore fails
      }

      if (isScroll) {
        placeHostAtEnd();
      }
      updateToggleButtons();
    });
  }, [isScroll, location, placeHostAtEnd, updateToggleButtons]);

  // When switching to scrolled mode, try placing host once
  useEffect(() => {
    if (isScroll) {
      placeHostAtEnd();
    }
  }, [isScroll, placeHostAtEnd]);

  // ========================= SCROLLED resize effect =========================
  useEffect(() => {
    if (!isScroll || !renditionRef.current) return;

    const container = getScrollContainer();
    if (!container) return;

    syncScrolledContainerLayout(true);

    return () => {
      if (container) {
        container.style.paddingTop = "";
        container.style.paddingBottom = "";
      }
      scrolledContainerTopPaddingRef.current = null;
    };
  }, [isScroll, showNav, syncScrolledContainerLayout]);

  // ========================= TAB VISIBILITY: 비활성 복귀 시 렌더 복구 ==========
  useEffect(() => {
    const handleResume = () => {
      if (document.visibilityState !== "visible") return;

      if (isScroll) {
        requestAnimationFrame(() => {
          syncScrolledContainerLayout(false);
          updateToggleButtons();
        });
        return;
      }

      requestAnimationFrame(() => {
        restoreVisibleRendition();
      });
    };

    document.addEventListener("visibilitychange", handleResume);
    window.addEventListener("focus", handleResume);
    window.addEventListener("pageshow", handleResume);
    return () => {
      document.removeEventListener("visibilitychange", handleResume);
      window.removeEventListener("focus", handleResume);
      window.removeEventListener("pageshow", handleResume);
    };
  }, [isScroll, restoreVisibleRendition, syncScrolledContainerLayout, updateToggleButtons]);

  useEffect(() => {
    if (isScroll && renditionRef.current && wrapperRef.current) {
      const width = wrapperRef.current.offsetWidth;
      const height = wrapperRef.current.offsetHeight;
      debouncedResize(renditionRef.current, width, height);
    }

    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [isScroll, debouncedResize]);

  // ========================= MOBILE SCROLLED: ENABLE DRAG SCROLL ON LastPage =========================

  useEffect(() => {
    // Only apply on real mobile devices and scrolled mode
    if (!isScroll || device !== "mobile" || !lastPageHostReady) return;
    const host = lastPageHostRef.current;
    const container = getScrollContainer();

    if (!host || !container) return;

    let startY = 0;
    let startScrollTop = 0;
    let isDragging = false;
    let bypassInteractiveTouch = false;
    const isInteractiveTarget = (target: EventTarget | null) =>
      target instanceof Element &&
      Boolean(
        target.closest(
          '[data-lastpage-interactive="true"], button, a, input, textarea, select, [role="button"]'
        )
      );

    // Use native touch events to control the EPUB scroll container
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      if (isInteractiveTarget(e.target)) {
        bypassInteractiveTouch = true;
        isDragging = false;
        return;
      }
      bypassInteractiveTouch = false;
      // Re-fetch container each time to avoid stale closure
      const c = getScrollContainer();
      if (!c) return;
      isDragging = true;
      startY = e.touches[0].clientY;
      startScrollTop = c.scrollTop;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (bypassInteractiveTouch) return;
      if (!isDragging || e.touches.length !== 1) return;
      const currentY = e.touches[0].clientY;
      const deltaY = startY - currentY;

      if (deltaY < 0) {
        // 위로 스크롤: preventDefault 호출하지 않아 iOS 네이티브 관성 스크롤 허용
        isDragging = false;
        return;
      }

      // 아래로 스크롤(마지막 페이지 내부): 직접 컨테이너 스크롤
      const c = getScrollContainer();
      if (!c) return;
      c.scrollTop = startScrollTop + deltaY;
      e.preventDefault();
      e.stopPropagation();
    };

    const handleTouchEnd = () => {
      if (bypassInteractiveTouch) {
        bypassInteractiveTouch = false;
        return;
      }
      isDragging = false;
    };

    host.addEventListener("touchstart", handleTouchStart, {
      passive: true,
      capture: true,
    });
    host.addEventListener("touchmove", handleTouchMove, {
      passive: false,
      capture: true,
    });
    host.addEventListener("touchend", handleTouchEnd, { capture: true });
    host.addEventListener("touchcancel", handleTouchEnd, { capture: true });

    return () => {
      host.removeEventListener("touchstart", handleTouchStart, {
        capture: true,
      } as any);
      host.removeEventListener("touchmove", handleTouchMove, {
        capture: true,
      } as any);
      host.removeEventListener("touchend", handleTouchEnd, {
        capture: true,
      } as any);
      host.removeEventListener("touchcancel", handleTouchEnd, {
        capture: true,
      } as any);
    };
  }, [isScroll, device, lastPageHostReady]);

  // ========================= RENDER =========================

  return (
    <div ref={containerRef}>
      {/* Loading overlay — EPUB 로딩 중 스크롤 밀림 방지 */}
      {isScroll && !epubReady && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: bgColor }}
        >
          <Spinner />
        </div>
      )}

      {/* Always render progress bar; width will be 0 at the start */}
      <div
        className={`${
          showNav ? "fixed top-[68px]" : "fixed top-0"
        } left-0 h-[3px] ${
          settings.theme === "dark" ? "bg-light-gray-300" : "bg-black"
        } transition-width duration-200 ease-out z-40`}
        style={{ width: `${progress}%` }}
      />

      <div className="flex justify-center">
        <div
          ref={wrapperRef}
          style={{
            backgroundColor: showLastPage ? bgColor : "transparent",
          }}
          className={`relative ${
            isScroll
              ? "h-screen w-full"
              : showNav
                ? "h-[calc(100vh-128px)] md:h-[calc(100vh-128px)] mt-[68px] w-full"
                : "h-screen w-full"
          }`}
        >
          {/* MAIN EPUB AREA */}
          <div
            className="w-full h-full"
            style={{ display: showLastPage ? "none" : "block" }}
          >
            <ReactReader
              key={`${epubUrl}-${isScroll ? "scrolled" : "paginated"}`}
              url={epubUrl}
              location={location}
              locationChanged={(loc) => {
                setLocation(loc);
              }}
              showToc={false}
              epubOptions={epubOptions}
              readerStyles={{
                ...ReactReaderStyle,
                arrow: { display: "none" },
                loadingView: { display: "none" },
                titleArea: isScroll ? { display: "none" } : ReactReaderStyle.titleArea,
                reader: isScroll
                  ? { position: "absolute", top: 0, left: 0, bottom: 0, right: 0 }
                  : ReactReaderStyle.reader,
                readerArea: {
                  ...ReactReaderStyle.readerArea,
                  backgroundColor: "var(--background-gray)",
                  padding: "0",
                  margin: "0",
                  overflowY: "hidden",
                  overflowX: "hidden",
                  height: "100%",
                },
                container: {
                  ...ReactReaderStyle.container,
                  padding: "0",
                  margin: "0",
                  height: "100%",
                },
              }}
              getRendition={(_rendition) => {
                initialScrolledBodyCoordinatorRef.current?.cancel();
                renditionRef.current = _rendition;
                const initialScrolledBodyCoordinator =
                  isScroll && location === 0
                    ? createInitialScrolledBodyCoordinator({
                        waitForBookReady: () => _rendition.book?.ready,
                        attemptBodyAttachment:
                          createInitialScrolledBodyAttachmentAttempt(_rendition),
                      })
                    : null;
                initialScrolledBodyCoordinatorRef.current =
                  initialScrolledBodyCoordinator;

                _rendition.on("rendered", () => {
                  initialScrolledBodyCoordinator?.onRendered();
                  if (isScroll && wrapperRef.current) {
                    const width = wrapperRef.current.offsetWidth;
                    const height = wrapperRef.current.offsetHeight;
                    debouncedResize(_rendition, width, height);
                    placeHostAtEnd();
                    syncScrolledContainerLayout(false);
                    if (pendingScrollRestoreTopRef.current !== null) {
                      const targetScrollTop = pendingScrollRestoreTopRef.current;
                      requestAnimationFrame(() => {
                        const container =
                          (_rendition as any)?.manager?.views?.container ||
                          (_rendition as any)?.manager?.container ||
                          null;
                        if (container) {
                          container.scrollTop = targetScrollTop;
                        }
                        pendingScrollRestoreTopRef.current = null;
                      });
                    }
                    // rendered에서도 타이머 리셋 — resize/placeHost가 스크롤을 밀 수 있음
                    if (!epubReadyDoneRef.current) {
                      if (epubReadyTimerRef.current) {
                        clearTimeout(epubReadyTimerRef.current);
                      }
                      epubReadyTimerRef.current = setTimeout(() => {
                        epubReadyDoneRef.current = true;
                        setEpubReady(true);
                      }, 800);
                    }
                  }
                  updateProgress();
                });

                _rendition.on("click", () => {
                  if (Date.now() < suppressNavToggleUntilRef.current) {
                    return;
                  }
                  handleToggleNav();
                });

                _rendition.on("relocated", (loc: any) => {
                  if (showLastPageRef.current) return;

                  const spine = _rendition.book?.spine;

                  // Safely get last spine item for different epubjs versions
                  let lastSpineItem: any = undefined;
                  if (spine) {
                    if (typeof (spine as any).last === "function") {
                      lastSpineItem = (spine as any).last();
                    } else if (Array.isArray((spine as any).items)) {
                      const items = (spine as any).items;
                      lastSpineItem = items[items.length - 1];
                    } else if (Array.isArray((spine as any).spineItems)) {
                      const items = (spine as any).spineItems;
                      lastSpineItem = items[items.length - 1];
                    }
                  }

                  const lastIndex =
                    typeof lastSpineItem?.index === "number"
                      ? lastSpineItem.index
                      : 0;

                  const currentIndex =
                    loc?.end?.index ?? loc?.start?.index ?? 0;

                  const displayed = loc?.start?.displayed;
                  const isLastPageInSection =
                    displayed && displayed.total
                      ? displayed.page >= displayed.total - 1
                      : false;

                  const isLastSection = currentIndex >= lastIndex;

                  if (!isScroll) {
                    setAtBookEnd(isLastSection && isLastPageInSection);
                    if (
                      device === "mobile" &&
                      skippedInitialMobileCoverRef.current &&
                      !isInitialMobileCoverVisible(_rendition)
                    ) {
                      skippedInitialMobileCoverRef.current = false;
                      requestAnimationFrame(() => {
                        updateTheme(_rendition);
                        const mgr = (_rendition as any).manager;
                        const container = mgr?.views?.container || mgr?.container;
                        const currentCfi = _rendition.location?.start?.cfi;
                        const width = container?.offsetWidth ?? 0;
                        const height = container?.offsetHeight ?? 0;
                        if (width > 0 && height > 0) {
                          try {
                            _rendition.resize(width, height);
                          } catch {}
                          if (currentCfi) {
                            requestAnimationFrame(() => {
                              try {
                                _rendition.display(currentCfi);
                              } catch {}
                            });
                          }
                        }
                      });
                    }
                  }

                  updateProgress();
                });

                _rendition.hooks.content.register((contents: Contents) => {
                  // SAFER: contents.document or contents.window?.document
                  const doc =
                    (contents as any).document || contents.window?.document;
                  if (!doc) return;
                  const css = `
                    @font-face {
                      font-family:"NanumMyeongjo";
                      font-weight:400;
                      font-style:normal;
                      src:url("/fonts/NanumMyeongjo-Regular.woff2") format("woff2");
                    }
                    @font-face {
                      font-family:"MaruBuri";
                      font-weight:400;
                      font-style:normal;
                      src:url("/fonts/MaruBuri-Regular.woff2") format("woff2");
                    }
                    @font-face {
                      font-family:"Pretendard";
                      font-weight:400;
                      font-style:normal;
                      src:url("/fonts/PretendardVariable.woff2") format("woff2");
                    }
                    @font-face {
                      font-family:"JoseonPalace";
                      font-weight:400;
                      font-style:normal;
                      src:url("https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_20-04@1.0/ChosunGs.woff") format("woff");
                    }
                    @font-face {
                      font-family:"NanumGothic";
                      font-weight:400;
                      font-style:normal;
                      src:url("https://fonts.gstatic.com/ea/nanumgothic/v5/NanumGothic-Regular.woff2") format("woff2");
                    }
                    @font-face {
                      font-family:"NotoSansKR";
                      font-weight:400;
                      font-style:normal;
                      src:url("https://fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Regular.woff2") format("woff2");
                    }
                    @font-face {
                      font-family:"KoPubDotum";
                      font-weight:400;
                      font-style:normal;
                      src:url("https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_two@1.0/KoPubDotumMedium.woff") format("woff");
                    }
                    ${isScroll ? (
                      device === "mobile"
                        ? `
                    html {
                      margin: 0 !important;
                      padding: 0 !important;
                      min-height: auto !important;
                      height: auto !important;
                      box-sizing: border-box !important;
                    }
                    body {
                      margin: 0 auto !important;
                      padding: 0 !important;
                      min-height: auto !important;
                      height: auto !important;
                      box-sizing: border-box !important;
                    }
                    `
                        : `
                    html {
                      margin: 0 !important;
                      padding: 0 !important;
                      min-height: auto !important;
                      height: auto !important;
                      box-sizing: border-box !important;
                    }
                    body {
                      margin: 0 auto !important;
                      padding: 0 24px !important;
                      min-height: auto !important;
                      height: auto !important;
                      box-sizing: border-box !important;
                      width: 100% !important;
                      max-width: 760px !important;
                    }
                    `
                    ) : `
                    body {
                      padding: 0 16px !important;
                      box-sizing: border-box !important;
                    }
                    `}
                  `;
                  const style = doc.createElement("style");
                  style.appendChild(doc.createTextNode(css));
                  doc.head.appendChild(style);

                  // 깨진 XHTML cover 페이지 복구: parsererror가 있으면
                  // body를 API coverImagePath로 교체 (정상 EPUB 표지와 동일한 뷰포트 맞춤)
                  const parserError = doc.querySelector("parsererror");
                  if (parserError && resolvedCoverImagePath) {
                    doc.body.innerHTML = `
                      <div style="
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        width:100%;
                        height:100vh;
                        margin:0;
                        padding:0;
                        overflow:hidden;
                      ">
                        <img
                          src="${resolvedCoverImagePath}"
                          alt="cover"
                          style="
                            display:block;
                            max-width:100%;
                            max-height:100vh;
                            object-fit:contain;
                          "
                        />
                      </div>`;
                    doc.body.style.margin = "0";
                    doc.body.style.padding = "0";
                    doc.body.style.overflow = "hidden";
                  } else if (parserError) {
                    parserError.style.display = "none";
                  }

                  updateTheme(_rendition);
                  updateToggleButtons();

                  if (isScroll) {
                    placeHostAtEnd();
                  } else if (!epubReadyDoneRef.current) {
                    epubReadyDoneRef.current = true;
                    setEpubReady(true);
                  }
                });

                initialScrolledBodyCoordinator?.start();
              }}
            />
          </div>

          {/* PAGINATED LastPage AREA */}
          <div
            className={`w-full h-full ${!isScroll ? "overflow-y-auto" : ""}`}
            style={{
              display: showLastPage ? "block" : "none",
              backgroundColor: bgColor,
            }}
          >
            <div className="mt-[96px] mb-[10px]">
              <LastPage
                currentEpisodeId={currentEpisodeId}
                handleCommentState={handleCommentState}
              />
            </div>
          </div>

          {/* PAGINATED ARROWS */}
          <div
            className="absolute inset-y-1/2 left-0 right-0 flex justify-between items-center px-4"
            style={{ display: isScroll ? "none" : "flex" }}
          >
            <ArrowIcon
              direction="left"
              color={showLastPage ? iconColor : leftArrowColor}
              onClick={(e: React.MouseEvent) => goToPrevPage(e)}
            />
            {!showLastPage && (
              <ArrowIcon
                direction="right"
                color={iconColor}
                onClick={(e: React.MouseEvent) => goToNextPage(e)}
              />
            )}
            {showLastPage && <div className="w-[10px] md:w-[20px]" />}
          </div>
        </div>
      </div>

      {/* SCROLLED MODE: LastPage inside EPUB scroll container via portal */}
      {isScroll && lastPageHostRef.current
        ? createPortal(
            <div style={{ backgroundColor: bgColor }}>
              <LastPage
                currentEpisodeId={currentEpisodeId}
                handleCommentState={handleCommentState}
              />
            </div>,
            lastPageHostRef.current
          )
        : null}
    </div>
  );
};

export default memo(EpubViewer);

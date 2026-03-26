import { usePostAiSignalEvent } from "@/app/api/query/recommendation";
import Spinner from "@/components/common/Spinner";
import { DEFAULT_PRODUCT_IMAGE } from "@/constants/common";
import LastPage from "@/components/viewer/LastPage";
import useMediaDevice from "@/hooks/useMediaDevice";
import useAuthStore from "@/store/authStore";
import useViewStore from "@/store/viewerStore";
import type { Contents, Rendition } from "epubjs";
import type React from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ReactReader, ReactReaderStyle } from "react-reader";
import ArrowLeft from "/public/images/arrow-left.svg";
import ArrowRight from "/public/images/arrow-right.svg";

const fontSizeMap = [
  "11px",
  "12.5px",
  "14px",
  "15.5px",
  "17px",
  "18.5px",
  "20px",
  "21.5px",
  "23px",
  "24.5px",
];

const letterSpacingMap = ["0px", "1px", "2px", "3px", "4px"];
const lineHeightMap = ["1.5rem", "2.5rem", "3.5rem", "4.5rem", "5.5rem"];
const COVER_IMAGE_SELECTORS =
  'img[src*="cover"], img[alt*="cover"], img[alt*="표지"], img[class*="cover"], .cover-image, .titlepage img, .frontcover img';

const themeColors: Record<string, string> = {
  light: "#f9f8f8",
  dark: "#292C32",
  green: "#C7D5C4",
  blue: "#C3CAD2",
};

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

  const device = useMediaDevice();
  const { isAuthenticated } = useAuthStore((s) => ({ isAuthenticated: s.isAuthenticated }));

  // Track when the LastPage host DOM node has been created
  // This is used to re-run the touch binding effect when the host actually exists.
  const [lastPageHostReady, setLastPageHostReady] = useState(false);

  // ========================= AI SIGNAL EVENTS =========================

  const { mutate: postSignalEvent } = usePostAiSignalEvent();

  const sessionIdRef = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  const activeSecondsRef = useRef(0);
  const progressRef = useRef(0);
  const episodeViewFiredRef = useRef(false);
  const episodeEndFiredRef = useRef(false);
  const latestReachedFiredRef = useRef(false);
  const lastExitTimeRef = useRef(0);

  useEffect(() => { progressRef.current = progress; }, [progress]);

  // Active reading time — only counts while epub is ready and tab is visible
  useEffect(() => {
    if (!epubReady) return;

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
  }, [epubReady]);

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
    if (epubReady && productId && isAuthenticated && !episodeViewFiredRef.current) {
      episodeViewFiredRef.current = true;
      postSignalEvent(buildSignalBody("episode_view"));
    }
  }, [epubReady, productId, isAuthenticated, buildSignalBody, postSignalEvent]);

  // 2) episode_end — fire once when progress >= 95%
  useEffect(() => {
    if (progress >= 95 && productId && isAuthenticated && !episodeEndFiredRef.current) {
      episodeEndFiredRef.current = true;
      postSignalEvent(buildSignalBody("episode_end"));
    }
  }, [progress, productId, isAuthenticated, buildSignalBody, postSignalEvent]);

  // 3) latest_episode_reached — 최신화 열람 도달 신호 (완독 의미 아님, 최신화를 열었다는 사실)
  useEffect(() => {
    if (epubReady && productId && isAuthenticated && nextEpisodeId === 0 && !latestReachedFiredRef.current) {
      latestReachedFiredRef.current = true;
      postSignalEvent(buildSignalBody("latest_episode_reached"));
    }
  }, [epubReady, productId, isAuthenticated, nextEpisodeId, buildSignalBody, postSignalEvent]);

  // 4) Exit progress — capture progress_ratio on page leave
  useEffect(() => {
    if (!productId || !isAuthenticated) return;

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
      if (document.visibilityState === "hidden") sendExitEvent();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", sendExitEvent);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", sendExitEvent);
      // SPA navigation (router.push) triggers unmount without visibilitychange/beforeunload
      sendExitEvent();
    };
  }, [productId, buildSignalBody]);

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

  const marginSizeMap = useMemo(() => {
    if (device === "mobile") {
      return ["100%", "95%", "90%", "85%", "80%"];
    } else {
      return ["95%", "85%", "73%", "69%", "65%"];
    }
  }, [device]);
  const desktopScrolledMaxWidthMap = useMemo(
    () => ["1000px", "920px", "840px", "760px", "680px"],
    []
  );

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

  const bgColor = useMemo(
    () => themeColors[settings.theme] || "#f9f8f8",
    [settings.theme]
  );
  const bgColorRef = useRef(bgColor);
  const contentTextColor = useMemo(
    () => (settings.theme === "dark" ? "#E4E4E4" : "#111317"),
    [settings.theme]
  );
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
            (img) => !img.getAttribute("src") || img.getAttribute("src") === ""
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

        let toggleButton =
          img.parentElement?.querySelector<HTMLButtonElement>(
            ".epub-cover-toggle"
          );

        const handleToggleClick = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          // settingsRef로 항상 최신값 참조 (stale closure 방지)
          setSettings({ hideImageCover: !settingsRef.current.hideImageCover });
        };

        if (!toggleButton) {
          toggleButton = doc.createElement("button");
          toggleButton.className = "epub-cover-toggle";
          toggleButton.style.cssText = `
            margin: 10px auto;
            padding: 10px 18px 10px 20px;
            background: transparent;
            color: #6B6E76;
            border: 1px solid #DFE1E8;
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
            font-family: inherit;
            transition: background-color 0.2s;
          `;
          img.parentElement?.insertBefore(toggleButton, img.nextSibling);
        }

        // Reset listeners
        toggleButton.replaceWith(toggleButton.cloneNode(true));
        toggleButton =
          img.parentElement?.querySelector<HTMLButtonElement>(
            ".epub-cover-toggle"
          )!;
        toggleButton.addEventListener("click", handleToggleClick);

        // Only show in scrolled mode
        toggleButton.style.display = isScroll ? "block" : "none";

        if (isScroll) {
          imgEl.style.display = settingsRef.current.hideImageCover ? "none" : "block";
          imgEl.style.margin = "0 auto";
          if (imgEl.parentElement) {
            imgEl.parentElement.style.textAlign = "center";
          }
        } else {
          imgEl.style.display = "";
          imgEl.style.margin = "";
          if (imgEl.parentElement) {
            imgEl.parentElement.style.textAlign = "";
          }
        }

        const iconSVG = settingsRef.current.hideImageCover
          ? `<svg width="9" height="5" viewBox="0 0 9 5" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path fill-rule="evenodd" clip-rule="evenodd" d="M8.37701 0.219783C8.08412 -0.0731099 7.60924 -0.0731095 7.31635 0.219784L4.29851 3.23762L1.28056 0.21967C0.987664 -0.0732237 0.51279 -0.0732236 0.219896 0.21967C-0.0729962 0.512563 -0.0729962 0.987437 0.219897 1.28033L3.7232 4.78363C3.88083 4.94126 4.09118 5.01406 4.2975 5.00202C4.50443 5.01462 4.71559 4.94186 4.87371 4.78374L8.37701 1.28044C8.6699 0.98755 8.6699 0.512676 8.37701 0.219783Z" fill="#8A8E96"/>
             </svg>`
          : `<svg width="9" height="5" viewBox="0 0 9 5" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path fill-rule="evenodd" clip-rule="evenodd" d="M0.21967 4.78412C0.512563 5.07702 0.987437 5.07702 1.28033 4.78412L4.29817 1.76628L7.31612 4.78424C7.60902 5.07713 8.08389 5.07713 8.37678 4.78424C8.66968 4.49134 8.66968 4.01647 8.37678 3.72358L4.87348 0.220278C4.71585 0.0626419 4.5055 -0.0101535 4.29918 0.00189047C4.09225 -0.0107142 3.88109 0.0620435 3.72297 0.220165L0.21967 3.72346C-0.0732234 4.01636 -0.0732233 4.49123 0.21967 4.78412Z" fill="#8A8E96"/>
             </svg>`;

        const labelText = settingsRef.current.hideImageCover ? "표지펴기" : "표지접기";
        toggleButton!.innerHTML = `
          <span style="display:inline-flex;align-items:center;gap:8px;">
            <span>${labelText}</span>
            ${iconSVG}
          </span>
        `;
      });

      if (!doc.body.getAttribute("data-cover-toggle-setup")) {
        doc.body.setAttribute("data-cover-toggle-setup", "true");
      }
    });
  }, [isScroll, resolvedCoverImagePath, setSettings, settings.hideImageCover]);

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

      switch (currentSettings.fontFamily) {
        case "고딕": {
          themes.override("font-family", "Pretendard");
          break;
        }
        case "명조체": {
          themes.override("font-family", "NanumMyeongjo");
          break;
        }
        case "마루부리": {
          themes.override("font-family", "MaruBuri");
          break;
        }
        case "조선궁서": {
          themes.override("font-family", "JoseonPalace");
          break;
        }
        case "나눔고딕": {
          themes.override("font-family", "NanumGothic");
          break;
        }
        case "본고딕": {
          themes.override("font-family", "NotoSansKR");
          break;
        }
        case "KoPub돋움": {
          themes.override("font-family", "KoPubDotum");
          break;
        }
      }

      themes.override("background-color", currentBgColor);
      themes.override("color", currentContentTextColor);

      const fontSize = fontSizeMap[currentSettings.fontSize - 1];
      if (fontSize) {
        themes.override("font-size", fontSize);
      }

      const letterSpacing = letterSpacingMap[currentSettings.letterSpacing - 1];
      if (letterSpacing) {
        themes.override("letter-spacing", letterSpacing);
      }

      const lineHeight = lineHeightMap[currentSettings.lineHeight - 1];
      rendition.themes.default({
        p: {
          ...(lineHeight ? { "line-height": `${lineHeight} !important` } : {}),
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
        lockContentSelection(doc);

        if (isScroll && device === "mobile") {
          // 모바일 세로보기: iframe 내부 body도 절대 px로 제한
          const viewportW = window.innerWidth || 390;
          const gap = (currentSettings.marginSize - 1) * 40;
          const mobileMaxW = `${viewportW - gap}px`;
          doc.body.style.setProperty("max-width", mobileMaxW, "important");
          doc.body.style.setProperty("margin", "0 auto", "important");
        } else if (isScroll && device !== "mobile") {
          const maxWidth =
            desktopScrolledMaxWidthMap[currentSettings.marginSize - 1] ||
            desktopScrolledMaxWidthMap[1];
          doc.body.style.setProperty("max-width", maxWidth, "important");
          doc.body.style.setProperty("margin", "0 auto", "important");
        } else {
          doc.body.style.removeProperty("max-width");
          doc.body.style.removeProperty("margin");
        }

        doc.querySelectorAll("p").forEach((paragraph: Element) => {
          (paragraph as HTMLElement).style.setProperty(
            "text-indent",
            currentSettings.useParagraphIndent ? "1em" : "0",
            "important"
          );
        });
      });
    },
    [marginSizeMap, isScroll, device, desktopScrolledMaxWidthMap, lockContentSelection]
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
                renditionRef.current = _rendition;

                _rendition.on("rendered", () => {
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

                  // content 재로드 시 표지 접기 상태 유지 (settingsRef는 항상 최신값)
                  if (isScroll && settingsRef.current.hideImageCover) {
                    doc.querySelectorAll(COVER_IMAGE_SELECTORS).forEach((el: Element) => {
                      (el as HTMLElement).style.display = "none";
                    });
                  }

                  if (isScroll) {
                    placeHostAtEnd();
                  } else if (!epubReadyDoneRef.current) {
                    epubReadyDoneRef.current = true;
                    setEpubReady(true);
                  }
                });
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

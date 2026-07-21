"use client";
import { IPopup, ISelectPopupsResponse } from "@/app/api/query/popup/dto";
import {
  ADMIN_POPUP_QUERY_API_PATH,
  ADMIN_POPUP_PRELOAD_WINDOW_KEY,
  isAdminPopupDismissedInCurrentView,
  shouldFetchAdminPopup,
} from "@/constants/adminPopup";
import {
  getLocalStorage,
  setLocalStorage,
  STORAGE_KEYS,
} from "@/utils/localStorage";
import {
  ONBOARDING_FIRST_LOGIN_SESSION_KEY,
  ONBOARDING_STATUS_CHANGED_EVENT,
} from "@/constants/onboarding";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type AdminPopupPreloadState = {
  status: "pending" | "resolved" | "rejected";
  data?: IPopup | null;
  promise?: Promise<IPopup | null> | null;
  consumed?: boolean;
};

type AdminPopupPreloadWindow = Window & {
  __likenovelAdminPopupPreload?: AdminPopupPreloadState;
};

const getAdminPopupPreloadState = () => {
  if (typeof window === "undefined") return undefined;
  const popupWindow = window as AdminPopupPreloadWindow;
  return popupWindow[ADMIN_POPUP_PRELOAD_WINDOW_KEY];
};

/**
 * AdminPopup Component
 * Displays popup images configured from CMS admin panel
 * Features:
 * - Shows popup when displayStatus is "shown" in CMS
 * - Shows only on main page ("/")
 * - Close button to dismiss popup
 * - "오늘 하루 보지 않기" 버튼으로 1일 숨김
 * - Stores hide preference in localStorage
 */
const AdminPopup = () => {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [currentPopup, setCurrentPopup] = useState<IPopup | null>(null);
  const [onboardingStatusVersion, setOnboardingStatusVersion] = useState(0);
  const dismissedPopupIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOnboardingStatusChanged = () => {
      setOnboardingStatusVersion((prev) => prev + 1);
    };
    window.addEventListener(
      ONBOARDING_STATUS_CHANGED_EVENT,
      handleOnboardingStatusChanged
    );
    return () => {
      window.removeEventListener(
        ONBOARDING_STATUS_CHANGED_EVENT,
        handleOnboardingStatusChanged
      );
    };
  }, []);

  useEffect(() => {
    // Show popup only on main page
    if (!shouldFetchAdminPopup(pathname)) {
      setIsVisible(false);
      setCurrentPopup(null);
      return;
    }

    if (typeof window !== "undefined") {
      const preloadState = getAdminPopupPreloadState();
      const pendingOnboarding =
        sessionStorage.getItem(ONBOARDING_FIRST_LOGIN_SESSION_KEY) === "Y";
      if (pendingOnboarding) {
        if (preloadState) preloadState.consumed = true;
        setIsVisible(false);
        return;
      }
    }

    const controller = new AbortController();

    const applyPopupIfAllowed = (popup?: IPopup | null) => {
      if (controller.signal.aborted) return;

      if (!popup?.id || !popup.imagePath) {
        setCurrentPopup(null);
        setIsVisible(false);
        return;
      }

      if (
        isAdminPopupDismissedInCurrentView(
          popup.id,
          dismissedPopupIdRef.current
        )
      ) {
        setIsVisible(false);
        return;
      }

      // Check localStorage for 1-day hide preference
      const closedUntilData = getLocalStorage<Record<string, string>>(
        STORAGE_KEYS.POPUP_CLOSED_UNTIL
      );

      if (closedUntilData && closedUntilData[popup.id]) {
        const closedUntil = new Date(closedUntilData[popup.id]);
        const now = new Date();

        if (now < closedUntil) {
          setIsVisible(false);
          return;
        }
      }

      setCurrentPopup(popup);
      setIsVisible(true);
    };

    const fetchPopup = async () => {
      const response = await fetch(ADMIN_POPUP_QUERY_API_PATH, {
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Popup request failed: ${response.status}`);
      }

      const popupsData = (await response.json()) as ISelectPopupsResponse;
      return popupsData?.data;
    };

    const showPopupIfAllowed = async () => {
      try {
        const popup = await fetchPopup();
        applyPopupIfAllowed(popup);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("[AdminPopup] Failed to load popup:", error);
        setCurrentPopup(null);
        setIsVisible(false);
      }
    };

    const preloadState = getAdminPopupPreloadState();

    if (preloadState?.consumed) {
      showPopupIfAllowed();
    } else if (preloadState?.status === "resolved") {
      preloadState.consumed = true;
      applyPopupIfAllowed(preloadState.data);
    } else if (preloadState?.status === "pending" && preloadState.promise) {
      preloadState.consumed = true;
      preloadState.promise
        .then(async (popup) => {
          const latestPreloadState = getAdminPopupPreloadState();
          if (!popup && latestPreloadState?.status === "rejected") {
            const fallbackPopup = await fetchPopup();
            applyPopupIfAllowed(fallbackPopup);
            return;
          }
          applyPopupIfAllowed(popup);
        })
        .catch((error) => {
          if (controller.signal.aborted) return;
          console.error("[AdminPopup] Failed to load popup:", error);
          setCurrentPopup(null);
          setIsVisible(false);
        });
    } else {
      showPopupIfAllowed();
    }

    return () => {
      controller.abort();
    };
  }, [pathname, onboardingStatusVersion]);

  const handleClose = () => {
    dismissedPopupIdRef.current = currentPopup?.id ?? null;
    setIsVisible(false);
  };

  const handleDontShowFor1Day = () => {
    if (!currentPopup) return;

    // Calculate date 1 day from now
    const closedUntil = new Date();
    closedUntil.setDate(closedUntil.getDate() + 1);

    const existingData =
      getLocalStorage<Record<string, string>>(
        STORAGE_KEYS.POPUP_CLOSED_UNTIL
      ) || {};

    const updatedData = {
      ...existingData,
      [currentPopup.id]: closedUntil.toISOString(),
    };

    setLocalStorage(STORAGE_KEYS.POPUP_CLOSED_UNTIL, updatedData);
    setIsVisible(false);
  };

  const handleImageClick = () => {
    if (currentPopup?.url) {
      window.open(currentPopup.url, "_blank");
    }
  };

  if (!isVisible || !currentPopup) return null;

  return (
    <div className="fixed z-[100] flex inset-0 bg-black/50 justify-center items-center">
      <div className="relative rounded-[20px] border border-light-gray-400 m-[15px] shadow-xl bg-white max-w-[90vw] max-h-[90vh] overflow-hidden">
        <div className="flex flex-col">
          <div
            className={currentPopup.url ? "cursor-pointer" : ""}
            onClick={handleImageClick}
          >
            <Image
              src={currentPopup.imagePath}
              alt="popup"
              width={1200}
              height={1200}
              priority
              sizes="(max-width: 768px) 90vw, 600px"
              className="w-full h-auto max-h-[70vh] object-contain"
            />
          </div>

          <div className="w-full border-t border-light-gray-500 flex">
            <button
              className="flex-1 h-[40px] md:h-[60px] hover:bg-light-gray-300 transition-colors text-12pxr md:text-16pxr font-medium"
              onClick={handleDontShowFor1Day}
            >
              오늘 하루 보지 않기
            </button>
            <div className="w-[1px] bg-light-gray-500" />
            <button
              className="flex-1 h-[40px] md:h-[60px] hover:bg-light-gray-300 transition-colors text-12pxr md:text-16pxr font-medium"
              onClick={handleClose}
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPopup;

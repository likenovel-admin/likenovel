"use client";
import { useSelectPopups } from "@/app/api/query/popup";
import { IPopup } from "@/app/api/query/popup/dto";
import {
  getLocalStorage,
  setLocalStorage,
  STORAGE_KEYS,
} from "@/utils/localStorage";
import {
  ONBOARDING_FIRST_LOGIN_SESSION_KEY,
  ONBOARDING_STATUS_CHANGED_EVENT,
} from "@/constants/onboarding";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const POPUP_SHOWN_SESSION_KEY = "popup_shown_on_main_session";

/**
 * AdminPopup Component
 * Displays popup images configured from CMS admin panel
 * Features:
 * - Shows popup when displayStatus is "shown" in CMS
 * - Shows only on main page ("/")
 * - Close button to dismiss popup
 * - "오늘 하루 보지 않기" 버튼으로 1일 숨김
 * - Shows once per browser session on main page
 * - Stores hide preference in localStorage
 */
const AdminPopup = () => {
  const { data: popupsData } = useSelectPopups();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [currentPopup, setCurrentPopup] = useState<IPopup | null>(null);
  const [onboardingStatusVersion, setOnboardingStatusVersion] = useState(0);

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
    if (pathname !== "/") {
      setIsVisible(false);
      return;
    }

    if (typeof window !== "undefined") {
      const pendingOnboarding =
        sessionStorage.getItem(ONBOARDING_FIRST_LOGIN_SESSION_KEY) === "Y";
      if (pendingOnboarding) {
        setIsVisible(false);
        return;
      }
    }

    const popup = popupsData?.data;

    if (!popup) {
      setCurrentPopup(null);
      setIsVisible(false);
      return;
    }

    setCurrentPopup(popup);

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

    // Show only once per browser session on main page
    if (typeof window !== "undefined") {
      let shownPopupIds: Record<string, boolean> = {};

      try {
        const raw = sessionStorage.getItem(POPUP_SHOWN_SESSION_KEY);
        shownPopupIds = raw
          ? (JSON.parse(raw) as Record<string, boolean>)
          : {};
      } catch {
        shownPopupIds = {};
      }

      if (shownPopupIds[popup.id]) {
        setIsVisible(false);
        return;
      }

      sessionStorage.setItem(
        POPUP_SHOWN_SESSION_KEY,
        JSON.stringify({
          ...shownPopupIds,
          [popup.id]: true,
        })
      );
    }

    setIsVisible(true);
  }, [popupsData, pathname, onboardingStatusVersion]);

  const handleClose = () => {
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
            <picture>
              <img
                src={currentPopup.imagePath}
                alt="popup"
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </picture>
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

"use client";
import { useSelectPopups } from "@/app/api/query/popup";
import { IPopup } from "@/app/api/query/popup/dto";
import {
  getLocalStorage,
  setLocalStorage,
  STORAGE_KEYS,
} from "@/utils/localStorage";
import { useEffect, useState } from "react";

/**
 * AdminPopup Component
 * Displays popup images configured from CMS admin panel
 * Features:
 * - Shows popup when displayStatus is "shown" in CMS
 * - Close button to dismiss popup
 * - "Don't show for 7 days" button to hide popup for 7 days
 * - Stores hide preference in localStorage
 */
const AdminPopup = () => {
  const { data: popupsData } = useSelectPopups();
  const [isVisible, setIsVisible] = useState(false);
  const [currentPopup, setCurrentPopup] = useState<IPopup | null>(null);

  useEffect(() => {
    // Check if there are active popups
    const activePopups = popupsData?.data;

    if (!activePopups) {
      setIsVisible(false);
      return;
    }

    // Get the first active popup
    const popup = activePopups;
    setCurrentPopup(popup);

    // Check localStorage for "don't show for 7 days" preference
    const closedUntilData = getLocalStorage<Record<string, string>>(
      STORAGE_KEYS.POPUP_CLOSED_UNTIL
    );

    if (closedUntilData && closedUntilData[popup.id]) {
      const closedUntil = new Date(closedUntilData[popup.id]);
      const now = new Date();

      // If current time is before the "closed until" date, don't show popup
      if (now < closedUntil) {
        setIsVisible(false);
        return;
      }
    }

    // Show popup
    setIsVisible(true);
  }, [popupsData]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleDontShowFor7Days = () => {
    if (!currentPopup) return;

    // Calculate date 7 days from now
    const closedUntil = new Date();
    closedUntil.setDate(closedUntil.getDate() + 7);

    // Get existing data or create new object
    const existingData =
      getLocalStorage<Record<string, string>>(
        STORAGE_KEYS.POPUP_CLOSED_UNTIL
      ) || {};

    // Update with new popup close date
    const updatedData = {
      ...existingData,
      [currentPopup.id]: closedUntil.toISOString(),
    };

    // Save to localStorage
    setLocalStorage(STORAGE_KEYS.POPUP_CLOSED_UNTIL, updatedData);

    // Hide popup
    setIsVisible(false);
  };

  const handleImageClick = () => {
    if (currentPopup?.url) {
      window.open(currentPopup.url, "_blank");
    }
  };

  if (!isVisible || !currentPopup || !currentPopup.url) return null;

  return (
    <div className="fixed z-[100] flex inset-0 bg-black/50 justify-center items-center">
      <div className="relative rounded-[20px] border border-light-gray-400 m-[15px] shadow-xl bg-white max-w-[90vw] max-h-[90vh] overflow-hidden">
        {/* Close button */}
        {/* <div className="absolute top-4 right-4 z-10">
          <button
            onClick={handleClose}
            className="w-30pxr h-30pxr rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-md"
            aria-label="Close popup"
          >
            <Close className="w-[15px] h-[15px]" />
          </button>
        </div> */}

        {/* Popup content */}
        <div className="flex flex-col">
          {/* Image - clickable if linkUrl exists */}
          <div
            className={currentPopup.url ? "cursor-pointer" : ""}
            onClick={handleImageClick}
          >
            <picture>
              {/* Desktop image */}
              <img
                src={currentPopup.imagePath}
                alt={"popup"}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </picture>
          </div>

          {/* Action buttons */}
          <div className="w-full border-t border-light-gray-500 flex">
            <button
              className="flex-1 h-[40px] md:h-[60px] hover:bg-light-gray-300 transition-colors text-12pxr md:text-16pxr font-medium"
              onClick={handleDontShowFor7Days}
            >
              7일 동안 보지 않기
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

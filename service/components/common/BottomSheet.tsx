"use client";
import useBottomSheetStore from "@/store/bottomSheetStore"; // 바텀 시트 스토어 import
import { useEffect } from "react";
import Close from "/public/images/close.svg";

interface Props {
  hasBlackOverlay?: boolean;
}

const BottomSheet = ({ hasBlackOverlay = true }: Props) => {
  const { isOpen, content, closeBottomSheet } = useBottomSheetStore();

  const preventScroll = (e: { preventDefault: () => void }) => {
    e.preventDefault();
  };

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("wheel", preventScroll, { passive: false });
    } else {
      window.removeEventListener("wheel", preventScroll);
    }

    return () => {
      window.removeEventListener("wheel", preventScroll);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    closeBottomSheet();
  };

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  return (
    <div
      className={`fixed z-50 w-full h-full bottom-0 left-0 right-0 ${
        hasBlackOverlay ? "bg-black/50" : ""
      } flex justify-center items-end transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={handleOverlayClick}
    >
      <div
        className={`w-full bg-white rounded-t-[20px] transform transition-transform duration-300`}
        onClick={handleContentClick}
      >
        <div className="flex justify-end">
          <button onClick={closeBottomSheet} className="mt-4 mr-4">
            <Close className="w-[15px] h-[15px]" />
          </button>
        </div>
        {content}
      </div>
    </div>
  );
};

export default BottomSheet;

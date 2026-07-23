"use client";
import {
  HTMLAttributes,
  ReactNode,
  Ref,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import Close from "/public/images/close.svg";

interface Props extends CommonModalProps {
  hasBlackOverlay?: boolean;
  children: ReactNode | ReactNode[];
  usePortal?: boolean;
  title?: ReactNode;
  hasCloseButton?: boolean;
  panelRef?: Ref<HTMLDivElement>;
  panelProps?: HTMLAttributes<HTMLDivElement>;
}

const BottomSheetContainer = ({
  hasBlackOverlay = true,
  isOpen,
  onClose,
  children,
  usePortal = true,
  title,
  hasCloseButton = true,
  panelRef,
  panelProps,
}: Props) => {
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
    onClose();
  };

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  const modalContent = (
    <div
      className={`fixed z-50 w-screen h-full bottom-0 left-0 right-0 ${
        hasBlackOverlay ? "bg-black/50" : ""
      } flex justify-center items-end transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={handleOverlayClick}
    >
      <div
        ref={panelRef}
        {...panelProps}
        className={`w-full bg-white rounded-t-[20px] transform transition-transform duration-300`}
        onClick={handleContentClick}
      >
        <div
          className={`flex items-center justify-center relative p-4 ${
            title ? "border-b" : ""
          }`}
        >
          <div className="text-18pxr font-semibold">{title}</div>
          {hasCloseButton && (
            <button
              type="button"
              aria-label="닫기"
              onClick={onClose}
              className="absolute right-4 top-4"
            >
              <Close className="w-[15px] h-[15px]" />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
  if (usePortal) {
    return createPortal(
      modalContent,
      document.getElementById("modal-root") || document.body
    );
  }
  return modalContent;
};

export default BottomSheetContainer;

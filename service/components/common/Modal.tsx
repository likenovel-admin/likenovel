"use client";
import useBottomSheetStore from "@/store/bottomSheetStore";
import useModalStore from "@/store/modalStore";
import { useEffect, useRef, useId } from "react";
import Close from "/public/images/close.svg";

interface Props {
  justifyAlign?: "start" | "end" | "center" | "between" | "around" | "evenly";
  itemsAlign?: "start" | "end" | "center" | "between" | "around" | "evenly";
  size: "sm" | "md" | "full" | "fit";
  hasBlackOverlay?: boolean;
  hasCloseButton?: boolean;
}

const Modal = ({
  justifyAlign = "center",
  itemsAlign = "center",
  size,
  hasBlackOverlay = true,
  hasCloseButton = true,
}: Props) => {
  const modalId = useId();
  const { isOpen, modalContent, closeModal, activeModalId, registerModal, unregisterModal } = useModalStore();
  const { closeBottomSheet } = useBottomSheetStore();
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Register this modal instance on mount and unregister on unmount
  useEffect(() => {
    registerModal(modalId);
    return () => {
      unregisterModal(modalId);
    };
  }, [modalId, registerModal, unregisterModal]);

  const preventScrollOutside = (e: WheelEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      e.preventDefault();
      return;
    }
    if (modalRef.current) {
      const isScrollAtTop = modalRef.current.scrollTop === 0;
      const isScrollAtBottom =
        modalRef.current.scrollHeight - (modalRef.current.scrollTop + 100) <=
        modalRef.current.clientHeight;
      if (
        (isScrollAtTop && e.deltaY < 0) ||
        (isScrollAtBottom && e.deltaY > 0)
      ) {
        e.preventDefault();
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("wheel", preventScrollOutside, {
        passive: false,
      });
    }
    return () => {
      window.removeEventListener("wheel", preventScrollOutside);
    };
  }, [isOpen]);

  // Only render if this is the active modal instance
  if (!isOpen || activeModalId !== modalId) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    closeModal();
    closeBottomSheet(); // Also close bottom sheet when overlay is clicked
  };

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  const getSizeStyles = () => {
    switch (size) {
      case "full":
        return "rounded-none md:rounded-[20px] md:border md:border-light-gray-400 md:m-[15px] md:shadow-xl w-screen h-screen md:max-h-[calc(100vh-30px)] overflow-hidden md:w-auto md:h-auto md:min-h-[200px] md:min-w-[300px]";
      case "md":
        return "rounded-[20px] border border-light-gray-400 m-[15px] shadow-xl w-[422px] h-[calc(100vh-30px)] overflow-hidden";
      case "sm":
        return "rounded-[20px] border border-light-gray-400 m-[15px] shadow-xl min-w-[300px] max-h-[500px] md:min-w-[402px] md:max-h-[600px] overflow-hidden";
      case "fit":
        return "rounded-none md:rounded-[20px] border border-light-gray-400 md:m-[15px] shadow-xl w-fit h-fit overflow-hidden";
      default:
        return "";
    }
  };

  return (
    <div
      className={`fixed z-50 flex inset-0 ${
        hasBlackOverlay ? "bg-black/50" : ""
      } justify-${justifyAlign} items-${itemsAlign}`}
      onClick={handleOverlayClick}
    >
      <div
        className={`${getSizeStyles()} bg-white`}
        onClick={handleContentClick}
      >
        {hasCloseButton && (
          <div className="flex justify-end pb-10pxr">
            <button
              onClick={() => {
                closeModal();
                closeBottomSheet(); // Also close bottom sheet when X button is clicked
              }}
              className="mt-4 mr-4"
            >
              <Close className="w-[15px] h-[15px]" />
            </button>
          </div>
        )}
        <div
          className={`overflow-y-auto ${
            size === "fit"
              ? "h-fit md:max-h-[calc(100vh-90px)]"
              : "max-h-[calc(100vh-90px)]"
          }`}
          ref={modalRef}
        >
          {modalContent}
        </div>
      </div>
    </div>
  );
};

export default Modal;

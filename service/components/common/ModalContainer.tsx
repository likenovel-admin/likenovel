"use client";
import {
  HTMLAttributes,
  ReactNode,
  Ref,
  useEffect,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import Close from "/public/images/close.svg";

interface Props extends CommonModalProps {
  justifyAlign?: "start" | "end" | "center" | "between" | "around" | "evenly";
  itemsAlign?: "start" | "end" | "center" | "between" | "around" | "evenly";
  size: "sm" | "md" | "full";
  hasBlackOverlay?: boolean;
  hasCloseButton?: boolean;
  children: ReactNode;
  usePortal?: boolean;
  title?: ReactNode;
  panelRef?: Ref<HTMLDivElement>;
  panelProps?: HTMLAttributes<HTMLDivElement>;
}

const ModalContainer = ({
  justifyAlign = "center",
  itemsAlign = "center",
  size,
  hasBlackOverlay = true,
  hasCloseButton = true,
  children,
  isOpen,
  onClose,
  usePortal = true,
  title,
  panelRef,
  panelProps,
}: Props) => {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const preventScrollOutside = (e: WheelEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      e.preventDefault();
      return;
    }
    if (modalRef.current) {
      // 모달 내부에 자체 스크롤 가능한 요소가 있으면 그 요소의 경계를 체크
      let el = e.target as HTMLElement | null;
      while (el && el !== modalRef.current) {
        if (
          el.scrollHeight > el.clientHeight &&
          ["auto", "scroll"].includes(getComputedStyle(el).overflowY)
        ) {
          const atTop = el.scrollTop === 0;
          const atBottom =
            el.scrollHeight - el.scrollTop <= el.clientHeight + 1;
          if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) {
            e.preventDefault();
          }
          return;
        }
        el = el.parentElement;
      }
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
    } else {
      window.removeEventListener("wheel", preventScrollOutside);
    }
    return () => {
      window.removeEventListener("wheel", preventScrollOutside);
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

  const getSizeStyles = () => {
    switch (size) {
      case "full":
        return "md:rounded-[20px] md:border md:border-light-gray-400 md:m-[15px] md:shadow-xl w-full h-full md:max-h-[calc(100vh-30px)] overflow-hidden md:w-auto md:h-auto md:min-h-[200px] md:min-w-[300px]";
      case "md":
        return "rounded-[20px] border border-light-gray-400 m-[15px] shadow-xl w-[422px] h-[calc(100vh-30px)]";
      case "sm":
        return "rounded-[20px] border border-light-gray-400 m-[15px] shadow-xl min-w-[300px] max-h-[500px] md:min-w-[402px] md:max-h-[500px]";
      default:
        return "";
    }
  };

  const modalContent = (
    <div
      className={`fixed z-[60] flex inset-0 ${
        hasBlackOverlay ? "bg-black/50" : ""
      } justify-${justifyAlign} items-${itemsAlign}`}
      onClick={handleOverlayClick}
    >
      <div
        ref={panelRef}
        {...panelProps}
        className={`${getSizeStyles()} bg-white ${
          size === "md" ? "overflow-y-auto overflow-x-hidden" : ""
        } flex flex-col h-fit`}
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
        <div className="overflow-y-auto flex-1" ref={modalRef}>
          {children}
        </div>
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

export default ModalContainer;

"use client";

import type {
  IWebsochatModelOption,
  WebsochatModelKey,
} from "@/app/api/query/websochat/dto";
import BottomSheetContainer from "@/components/common/BottomSheetContainer";
import useMediaDevice from "@/hooks/useMediaDevice";
import { useCallback, useEffect, useId, useRef, useState } from "react";

const MODEL_DESCRIPTIONS: Record<WebsochatModelKey, string> = {
  speed: "답변을 빠르게 이어가요",
  balance: "속도와 맥락을 균형 있게 살펴요",
  deep: "맥락을 더 깊게 생각해 답해요",
};

interface Props {
  modelOptions: IWebsochatModelOption[];
  selectedModelKey: WebsochatModelKey;
  disabled?: boolean;
  onBeforeMobileOpen?: () => void;
  onSelect: (modelKey: WebsochatModelKey) => Promise<void> | void;
}

const WebsochatModelSelector = ({
  modelOptions,
  selectedModelKey,
  disabled = false,
  onBeforeMobileOpen,
  onSelect,
}: Props) => {
  const device = useMediaDevice();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const selectedOptionRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const isMobile = device === "mobile";
  const selectedOption =
    modelOptions.find((option) => option.modelKey === selectedModelKey)
    ?? modelOptions[0];
  const isDisabled = disabled || isSaving || modelOptions.length === 0;

  const closeSelector = useCallback((restoreFocus = false) => {
    setIsOpen(false);
    setErrorMessage("");
    if (restoreFocus) {
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeSelector(true);
    };
    const handlePointerDown = (event: MouseEvent) => {
      if (isMobile || rootRef.current?.contains(event.target as Node)) return;
      closeSelector();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    window.requestAnimationFrame(() => selectedOptionRef.current?.focus());
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [closeSelector, isMobile, isOpen]);

  useEffect(() => {
    if (disabled && isOpen) closeSelector();
  }, [closeSelector, disabled, isOpen]);

  const handleOpen = () => {
    if (isDisabled) return;
    if (isMobile) onBeforeMobileOpen?.();
    setErrorMessage("");
    setIsOpen((current) => !current);
  };

  const handleSelect = async (modelKey: WebsochatModelKey) => {
    if (isDisabled) return;
    if (modelKey === selectedModelKey) {
      closeSelector(true);
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    try {
      await onSelect(modelKey);
      closeSelector(true);
    } catch {
      setErrorMessage("모델을 변경하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  const optionList = (
    <div
      id={listboxId}
      role="listbox"
      aria-label="대화 모델"
      className="py-4pxr"
    >
      {modelOptions.map((option) => {
        const isSelected = option.modelKey === selectedModelKey;
        return (
          <button
            key={option.modelKey}
            ref={isSelected ? selectedOptionRef : undefined}
            type="button"
            role="option"
            aria-selected={isSelected}
            disabled={isSaving}
            onClick={() => void handleSelect(option.modelKey)}
            className={`flex w-full items-center gap-12pxr px-16pxr py-12pxr text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              isSelected ? "bg-light-gray-100" : "hover:bg-light-gray-100"
            }`}
          >
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-6pxr text-14pxr font-semibold text-dark-gray-500">
                {option.displayName}
                {isSelected ? (
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-primary-100"
                    aria-hidden="true"
                  >
                    <path d="m5 12 4 4L19 6" />
                  </svg>
                ) : null}
              </span>
              <span className="mt-2pxr block text-12pxr leading-[1.4] text-dark-gray-300">
                {MODEL_DESCRIPTIONS[option.modelKey]}
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-13pxr font-semibold text-dark-gray-500">
                {option.cashCostPerMessage}C
              </span>
              <span className="mt-2pxr block text-11pxr text-dark-gray-300">
                {option.freeRemainingMessages > 0
                  ? `무료 ${option.freeRemainingMessages}회`
                  : "무료 소진"}
              </span>
            </span>
          </button>
        );
      })}
      {errorMessage ? (
        <p
          role="alert"
          className="px-16pxr pb-8pxr pt-4pxr text-12pxr text-red-100"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-label={`모델 선택, 현재 ${selectedOption?.displayName || "스피드"}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        disabled={isDisabled}
        onClick={handleOpen}
        className="flex h-[32px] max-w-[72px] items-center gap-4pxr rounded-[8px] border border-light-gray-400 bg-white px-8pxr text-12pxr font-medium text-dark-gray-500 transition-colors hover:border-primary-100 hover:text-primary-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="truncate">{selectedOption?.displayName || "스피드"}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
          aria-hidden="true"
        >
          <path d="M3 8l3-4 3 4" />
        </svg>
      </button>

      {isOpen && !isMobile ? (
        <div className="absolute bottom-full left-0 z-40 mb-8pxr w-[280px] overflow-hidden rounded-[10px] border border-light-gray-300 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
          {optionList}
        </div>
      ) : null}

      {isMobile ? (
        <BottomSheetContainer
          isOpen={isOpen}
          onClose={() => closeSelector()}
          title="모델 선택"
          usePortal
        >
          <div className="pb-[max(env(safe-area-inset-bottom),16px)]">
            {optionList}
          </div>
        </BottomSheetContainer>
      ) : null}
    </div>
  );
};

export default WebsochatModelSelector;

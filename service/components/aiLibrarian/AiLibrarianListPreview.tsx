"use client";

import { ONBOARDING_SELECTED_TAG_CHIP_CLASS } from "@/components/recommendation/tagChipStyles";

interface Props {
  preview?: string;
  previewLines?: string[];
  chips?: string[];
  isVisible: boolean;
  onClick: () => void;
  className?: string;
}

export default function AiLibrarianListPreview({
  preview,
  previewLines,
  chips = [],
  isVisible,
  onClick,
  className = "",
}: Props) {
  const lines =
    previewLines && previewLines.length > 0
      ? previewLines.filter(Boolean).slice(0, 2)
      : preview
      ? [preview]
      : [];
  const visibleChips = chips.filter(Boolean).slice(0, 3);
  if (lines.length === 0 && visibleChips.length === 0) return null;

  return (
    <div
      className={`overflow-hidden transition-[max-height,padding-top] duration-200 ease-out motion-reduce:transition-none ${
        isVisible ? "max-h-[112px] pt-6pxr" : "max-h-0 pt-0"
      } ${className}`}
    >
      <button
        type="button"
        aria-hidden={!isVisible}
        tabIndex={isVisible ? 0 : -1}
        onClick={(event) => {
          event.stopPropagation();
          onClick();
        }}
        className={`w-full text-left transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none ${
          isVisible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        <div className="flex flex-col gap-4pxr border border-light-gray-500 bg-light-gray-100 px-10pxr py-6pxr rounded-[10px]">
          <span className="text-10pxr leading-[13px] font-bold text-primary-100">
            AI 사서
          </span>
          {visibleChips.length > 0 && (
            <span className="flex flex-wrap gap-4pxr">
              {visibleChips.map((chip) => (
                <span
                  key={chip}
                  className={`${ONBOARDING_SELECTED_TAG_CHIP_CLASS} max-w-[112px]`}
                >
                  <span className="truncate">{chip}</span>
                </span>
              ))}
            </span>
          )}
          <span className="flex flex-col text-11pxr leading-[15px] text-dark-gray-500">
            {lines.map((line, index) => (
              <span key={`${index}-${line}`} className="line-clamp-1">
                {line}
              </span>
            ))}
          </span>
        </div>
      </button>
    </div>
  );
}

"use client";

const AI_LIBRARIAN_LIST_TAG_CHIP_CLASS =
  "inline-flex min-h-[24px] max-w-[104px] items-center rounded-full border border-light-gray-600 bg-white px-8pxr py-2pxr text-12pxr leading-[16px] font-medium tracking-[-2%] text-dark-gray-400";

interface Props {
  preview?: string;
  previewLines?: string[];
  chips?: string[];
  isVisible: boolean;
  onClick: () => void;
  onAskMore?: () => void;
  className?: string;
}

export default function AiLibrarianListPreview({
  preview,
  previewLines,
  chips = [],
  isVisible,
  onClick,
  onAskMore,
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
        isVisible ? "max-h-[184px] pt-6pxr" : "max-h-0 pt-0"
      } ${className}`}
    >
      <div
        aria-hidden={!isVisible}
        className={`w-full transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none ${
          isVisible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        <div className="flex flex-col gap-6pxr rounded-[10px] border border-light-gray-500 bg-light-gray-100 px-12pxr py-10pxr">
          <button
            type="button"
            tabIndex={isVisible ? 0 : -1}
            onClick={(event) => {
              event.stopPropagation();
              onClick();
            }}
            className="w-full rounded-[6px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100 focus-visible:ring-offset-2"
          >
            <span className="flex flex-wrap items-center gap-x-6pxr gap-y-4pxr">
              <span className="shrink-0 text-12pxr font-bold leading-[16px] tracking-[-2%] text-primary-100">
                AI 사서
              </span>
              {visibleChips.length > 0 && (
                <span className="flex flex-wrap gap-4pxr">
                  {visibleChips.map((chip) => (
                    <span
                      key={chip}
                      className={AI_LIBRARIAN_LIST_TAG_CHIP_CLASS}
                    >
                      <span className="truncate">{chip}</span>
                    </span>
                  ))}
                </span>
              )}
            </span>
            <span className="mt-6pxr flex flex-col text-12pxr leading-[18px] tracking-[-2%] text-dark-gray-500">
              {lines.map((line, index) => (
                <span key={`${index}-${line}`} className="line-clamp-1">
                  {line}
                </span>
              ))}
            </span>
          </button>
          {onAskMore && (
            <button
              type="button"
              tabIndex={isVisible ? 0 : -1}
              onClick={(event) => {
                event.stopPropagation();
                onAskMore();
              }}
              className="inline-flex min-h-[36px] self-end items-center justify-center rounded-[6px] border border-light-gray-600 bg-white px-10pxr text-12pxr font-medium leading-[16px] tracking-[-2%] text-primary-100 hover:bg-light-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100 focus-visible:ring-offset-2"
            >
              AI사서에게 더 물어보기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

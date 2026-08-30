"use client";

const AI_LIBRARIAN_LIST_TAG_CHIP_CLASS =
  "inline-flex min-h-[24px] max-w-[104px] items-center rounded-full border border-light-gray-600 bg-white px-8pxr py-2pxr text-12pxr leading-[16px] font-medium tracking-[-2%] text-dark-gray-400";

interface Props {
  preview?: string;
  previewLines?: string[];
  intro?: string;
  points?: string[];
  chips?: string[];
  isVisible: boolean;
  onClick: () => void;
  onAskMore?: () => void;
  className?: string;
}

export default function AiLibrarianListPreview({
  preview,
  previewLines,
  intro,
  points = [],
  chips = [],
  isVisible,
  onClick,
  onAskMore,
  className = "",
}: Props) {
  const previewText =
    previewLines && previewLines.length > 0
      ? previewLines.filter(Boolean).join(" ").trim()
      : preview
      ? preview.trim()
      : "";
  const introText = intro?.trim() || previewText;
  const visiblePoints = points
    .map((point) => point.trim())
    .filter(Boolean)
    .slice(0, 2);
  const visibleChips = chips.filter(Boolean).slice(0, 3);
  if (!introText && visiblePoints.length === 0 && visibleChips.length === 0) {
    return null;
  }

  return (
    <div
      className={`overflow-hidden transition-[max-height,padding-top] duration-200 ease-out motion-reduce:transition-none ${
        isVisible ? "max-h-[300px] pt-6pxr" : "max-h-0 pt-0"
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
            {visiblePoints.length > 0 && (
              <span
                role="list"
                className="mt-6pxr flex flex-col gap-4pxr"
              >
                {visiblePoints.map((point) => (
                  <span
                    key={point}
                    role="listitem"
                    className="flex items-start gap-7pxr text-12pxr leading-[18px] tracking-[-2%] text-dark-gray-500"
                  >
                    <span className="mt-[7px] h-[4px] w-[4px] shrink-0 rounded-full bg-dark-gray-300" />
                    <span className="line-clamp-3 break-keep">{point}</span>
                  </span>
                ))}
              </span>
            )}
            {introText && (
              <span
                className={`block line-clamp-3 break-keep text-12pxr leading-[18px] tracking-[-2%] text-dark-gray-500 ${
                  visiblePoints.length > 0
                    ? "mt-8pxr border-t border-light-gray-400 pt-8pxr"
                    : "mt-6pxr"
                }`}
              >
                {introText}
              </span>
            )}
          </button>
          {onAskMore && (
            <button
              type="button"
              tabIndex={isVisible ? 0 : -1}
              onClick={(event) => {
                event.stopPropagation();
                onAskMore();
              }}
              className="mr-[54px] inline-flex min-h-[36px] self-end items-center justify-center rounded-[6px] border border-primary-100 bg-white px-10pxr text-12pxr font-medium leading-[16px] tracking-[-2%] text-primary-100 hover:bg-light-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100 focus-visible:ring-offset-2 md:mr-0"
            >
              AI 사서에게 묻기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

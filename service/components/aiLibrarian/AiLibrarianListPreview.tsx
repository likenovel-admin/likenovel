"use client";

interface Props {
  preview?: string;
  previewLines?: string[];
  isVisible: boolean;
  onClick: () => void;
}

export default function AiLibrarianListPreview({
  preview,
  previewLines,
  isVisible,
  onClick,
}: Props) {
  const lines =
    previewLines && previewLines.length > 0
      ? previewLines.filter(Boolean).slice(0, 2)
      : preview
      ? [preview]
      : [];
  if (lines.length === 0) return null;

  return (
    <div className="h-[58px] overflow-hidden pt-6pxr pr-[70px] md:pr-0">
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
        <div className="flex items-start gap-8pxr border border-light-gray-500 bg-light-gray-100 px-10pxr py-7pxr rounded-[10px]">
          <span className="shrink-0 text-11pxr font-bold text-primary-100">
            AI 사서
          </span>
          <span className="min-w-0 flex flex-col text-12pxr leading-[16px] text-dark-gray-500">
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

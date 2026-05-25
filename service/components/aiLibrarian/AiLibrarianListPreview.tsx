"use client";

interface Props {
  preview: string;
  isVisible: boolean;
  onClick: () => void;
}

export default function AiLibrarianListPreview({
  preview,
  isVisible,
  onClick,
}: Props) {
  if (!preview) return null;

  return (
    <div className="h-[48px] overflow-hidden pt-6pxr pr-[70px] md:pr-0">
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
        <div className="flex items-start gap-8pxr border border-light-gray-500 bg-light-gray-100 px-10pxr py-8pxr rounded-[10px]">
          <span className="shrink-0 text-11pxr font-bold text-primary-100">
            AI 사서
          </span>
          <span className="min-w-0 text-12pxr leading-[17px] text-dark-gray-500 line-clamp-2">
            {preview}
          </span>
        </div>
      </button>
    </div>
  );
}

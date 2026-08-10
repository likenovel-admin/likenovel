"use client";

import { buildEpisodePreviewDocument } from "@/utils/episodePreviewDocument";
import type { ViewerAppearanceSettings } from "@/utils/viewerAppearance";
import { useEffect, useMemo, useRef, useState } from "react";
import Close from "/public/images/close.svg";

type PreviewDevice = "mobile" | "desktop";

interface Props {
  title: string;
  contentHtml: string;
  settings: ViewerAppearanceSettings;
  onClose: () => void;
}

const EpisodePreviewDialog = ({
  title,
  contentHtml,
  settings,
  onClose,
}: Props) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 767px)").matches
      ? "mobile"
      : "desktop"
  );
  const previewDocument = useMemo(
    () => buildEpisodePreviewDocument({ title, contentHtml, settings }),
    [contentHtml, settings, title]
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    closeButtonRef.current?.focus();

    return () => {
      if (dialog.open) {
        dialog.close();
      }
      document.body.style.overflow = previousBodyOverflow;
      previousFocusRef.current?.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby="episode-preview-title"
      className="m-0 h-[100dvh] max-h-none w-screen max-w-none bg-white p-0 backdrop:bg-black/50 md:m-auto md:h-[calc(100dvh-30px)] md:rounded-[10px]"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="flex h-full flex-col">
        <header className="flex min-h-[64px] items-center justify-between gap-8pxr border-b border-light-gray-400 bg-white px-16pxr md:px-24pxr">
          <div className="min-w-0">
            <p id="episode-preview-title" className="text-16pxr font-semibold">
              회차 미리보기
            </p>
            <p className="text-12pxr leading-[18px] text-dark-gray-300">
              현재는 세로보기만 지원합니다.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-8pxr">
            <div
              role="group"
              aria-label="미리보기 기기"
              className="flex items-center rounded-[8px] border border-light-gray-400 bg-light-gray-100 p-[2px]"
            >
              <button
                type="button"
                title="모바일"
                aria-label="모바일 미리보기"
                aria-pressed={previewDevice === "mobile"}
                className={`flex h-[44px] w-[44px] items-center justify-center rounded-[6px] border transition-colors duration-150 ${
                  previewDevice === "mobile"
                    ? "border-light-gray-400 bg-white text-primary-100"
                    : "border-transparent text-dark-gray-300 hover:text-dark-gray-500"
                }`}
                onClick={() => setPreviewDevice("mobile")}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-[18px] w-[18px]"
                >
                  <rect
                    x="6.5"
                    y="2.5"
                    width="11"
                    height="19"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M10 18.5h4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                title="PC"
                aria-label="PC 미리보기"
                aria-pressed={previewDevice === "desktop"}
                className={`flex h-[44px] w-[44px] items-center justify-center rounded-[6px] border transition-colors duration-150 ${
                  previewDevice === "desktop"
                    ? "border-light-gray-400 bg-white text-primary-100"
                    : "border-transparent text-dark-gray-300 hover:text-dark-gray-500"
                }`}
                onClick={() => setPreviewDevice("desktop")}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-[18px] w-[18px]"
                >
                  <rect
                    x="3"
                    y="4"
                    width="18"
                    height="13"
                    rx="1.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M8 21h8M12 17v4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="미리보기 닫기"
              className="flex h-[44px] w-[44px] items-center justify-center rounded-[6px] hover:bg-light-gray-100"
              onClick={onClose}
            >
              <Close className="h-[16px] w-[16px]" />
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-auto bg-light-gray-100">
          <div
            className={`mx-auto h-full bg-white ${
              previewDevice === "mobile"
                ? "w-full max-w-[390px] border-x border-light-gray-400"
                : "w-full min-w-[1024px]"
            }`}
          >
            <iframe
              title={`${title || "회차"} 독자 화면 미리보기`}
              sandbox="allow-same-origin"
              referrerPolicy="no-referrer"
              srcDoc={previewDocument}
              className="block h-full w-full border-0"
            />
          </div>
        </div>
      </div>
    </dialog>
  );
};

export default EpisodePreviewDialog;

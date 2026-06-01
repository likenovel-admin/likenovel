"use client";

import { ReactNode, useRef, useState } from "react";
import { toBlob, toJpeg } from "html-to-image";

/**
 * 리포트 모달 (범용 캡처 쉘). setModal()로 띄운다.
 * children(리포트 카드)만 이미지로 변환 — 아이콘 행은 이미지에서 제외.
 * 복사=PNG(브라우저 클립보드 제약), 다운로드=JPG.
 */

interface AuthorReportModalProps {
  fileName: string;
  children: ReactNode;
}

const AuthorReportModal = ({ fileName, children }: AuthorReportModalProps) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const handleDownload = async () => {
    if (!reportRef.current || busy) return;
    setBusy(true);
    try {
      const dataUrl = await toJpeg(reportRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `${fileName}.jpg`;
      link.href = dataUrl;
      link.click();
      setStatus("이미지를 저장했어요.");
    } catch {
      setStatus("이미지 저장에 실패했어요.");
    } finally {
      setBusy(false);
      setTimeout(() => setStatus(""), 2000);
    }
  };

  const handleCopy = async () => {
    if (!reportRef.current || busy) return;
    setBusy(true);
    try {
      const blob = await toBlob(reportRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      if (!blob) {
        throw new Error("blob-failed");
      }
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setStatus("클립보드에 복사했어요.");
    } catch {
      setStatus("복사가 안 되는 환경이에요. 다운로드를 이용해 주세요.");
    } finally {
      setBusy(false);
      setTimeout(() => setStatus(""), 2500);
    }
  };

  return (
    <div className="px-16pxr pb-16pxr">
      <div className="mb-10pxr flex items-center justify-end gap-8pxr">
        <button
          type="button"
          onClick={handleCopy}
          disabled={busy}
          aria-label="클립보드 복사"
          className="flex h-[36px] w-[36px] items-center justify-center rounded-[8px] border border-light-gray-300 text-dark-gray-500 disabled:opacity-40"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </svg>
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={busy}
          aria-label="JPG 다운로드"
          className="flex h-[36px] w-[36px] items-center justify-center rounded-[8px] border border-light-gray-300 text-dark-gray-500 disabled:opacity-40"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3v12" />
            <path d="m7 11 5 5 5-5" />
            <path d="M5 21h14" />
          </svg>
        </button>
      </div>
      {status ? (
        <p className="mb-8pxr text-right text-12pxr text-dark-gray-400">{status}</p>
      ) : null}
      <div ref={reportRef}>{children}</div>
    </div>
  );
};

export default AuthorReportModal;

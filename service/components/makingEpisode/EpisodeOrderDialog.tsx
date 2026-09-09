"use client";

import type { EpisodeOrderRow } from "@/utils/episodeTitleOrder";
import { useEffect, useRef } from "react";
import Button from "../common/Button";
import RoundBadge from "../common/RoundBadge";
import Close from "/public/images/close.svg";

const releaseBadgeType = {
  open: "release",
  reserve: "reservation",
  private: "private",
} as const;

// 회차관리 목록과 같은 표기를 쓴다.
const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

interface Props {
  rows: readonly EpisodeOrderRow[];
  returnFocusTo: HTMLElement | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function EpisodeOrderDialog({ rows, returnFocusTo, isSubmitting, onCancel, onConfirm }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const currentRef = useRef<HTMLLIElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    cancelRef.current?.focus({ preventScroll: true });
    const list = listRef.current;
    const current = currentRef.current;
    if (list && current) {
      list.scrollTop += current.getBoundingClientRect().top - list.getBoundingClientRect().top
        - (list.clientHeight - current.clientHeight) / 2;
    }
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      requestAnimationFrame(() => {
        if (returnFocusTo?.isConnected) returnFocusTo.focus({ preventScroll: true });
      });
    };
  }, [returnFocusTo]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="episode-order-title"
      aria-describedby="episode-order-description"
      aria-busy={isSubmitting}
      className="m-auto max-h-[calc(100dvh-30px)] w-[calc(100%-30px)] max-w-[560px] rounded-[20px] border border-light-gray-400 bg-white p-0 text-dark-gray-500 shadow-xl backdrop:bg-black/50"
      onCancel={(event) => {
        event.preventDefault();
        if (!isSubmitting) onCancel();
      }}
    >
      <header className="flex items-center justify-between border-b border-light-gray-400 px-20pxr py-12pxr">
        <h2 id="episode-order-title" className="text-16pxr font-semibold">회차 순서 확인</h2>
        <button type="button" aria-label="닫기" disabled={isSubmitting} onClick={onCancel} className="flex h-40pxr w-40pxr items-center justify-center disabled:opacity-50">
          <Close className="h-16pxr w-16pxr" />
        </button>
      </header>
      <div className="p-20pxr">
        <ol ref={listRef} aria-label="전체 회차목록" tabIndex={0} className="max-h-[45dvh] overflow-y-auto overscroll-contain rounded-[8px] border border-light-gray-400">
          {rows.map((row) => {
            const reserveDateText = row.publishReserveDate ? formatDateTime(row.publishReserveDate) : null;
            const createdDateText = row.createdDate ? formatDateTime(row.createdDate) : null;
            return (
              <li
                key={row.episodeId ?? "new"}
                ref={row.isCurrent ? currentRef : undefined}
                aria-current={row.isCurrent ? "true" : undefined}
                className={`flex flex-col gap-4pxr border-b border-light-gray-400 px-12pxr py-10pxr text-14pxr last:border-b-0 ${row.isCurrent ? "bg-primary-100/10 font-semibold text-primary-100" : ""}`}
              >
                <div className="flex gap-10pxr">
                  <span className="shrink-0">{row.episodeNo}화</span>
                  <span className="min-w-0 flex-1 break-words">{row.episodeTitle}</span>
                  {row.isCurrent && <span className="shrink-0 text-12pxr">{row.episodeId === null ? "등록 예정" : "수정 예정"}</span>}
                </div>
                <div className="flex flex-wrap items-center gap-8pxr text-12pxr font-normal text-dark-gray-300">
                  <RoundBadge type={releaseBadgeType[row.releaseState]} />
                  {row.releaseState === "reserve" && (
                    <span className="text-primary-100">{reserveDateText ? `${reserveDateText} 공개예정` : "공개예정일시 미정"}</span>
                  )}
                  {createdDateText && <span>{createdDateText} 등록</span>}
                </div>
              </li>
            );
          })}
        </ol>
        <p id="episode-order-description" className="mb-20pxr mt-20pxr text-16pxr">회차 순서를 한번 더 확인해주세요.</p>
        <div className="flex gap-8pxr">
          <button ref={cancelRef} type="button" disabled={isSubmitting} onClick={onCancel} className="min-h-44pxr flex-1 rounded-lg border border-light-gray-400 px-8pxr text-14pxr disabled:opacity-50">돌아가서 확인</button>
          <Button type="button" disabled={isSubmitting} onClick={onConfirm} className="min-h-44pxr flex-1 text-14pxr">그대로 저장</Button>
        </div>
      </div>
    </dialog>
  );
}

"use client";

import useSearchModalStore from "@/store/searchModalStore";
import { useEffect, useRef } from "react";
import SearchWorkspace from "./SearchWorkspace";
import Close from "/public/images/close.svg";

export default function SearchModal() {
  const { isOpen, closeSearchModal } = useSearchModalStore();
  const dialog = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => {
      if (window.innerWidth >= 768) dialog.current?.querySelector("input")?.focus();
      else dialog.current?.focus();
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeSearchModal(); return; }
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialog.current?.querySelectorAll<HTMLElement>("button:not([disabled]), input, select, a[href]") || []);
      const first = focusable[0], last = focusable[focusable.length - 1];
      const outside = !dialog.current?.contains(document.activeElement) || document.activeElement === dialog.current;
      if (event.shiftKey && (document.activeElement === first || outside)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || outside)) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [isOpen, closeSearchModal]);
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-[60] flex justify-center bg-black/20 md:pt-[calc(80px_+_var(--top-notice-bar-h,0px))] md:pb-16pxr" onClick={closeSearchModal}>
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="search-modal-title" tabIndex={-1}
      className="flex h-full min-h-0 w-full flex-col bg-white px-16pxr pb-20pxr md:max-h-[85dvh] md:max-w-[714px] md:rounded-[20px] md:border md:border-light-gray-400 md:shadow-xl md:px-30pxr outline-none"
      onClick={(event) => event.stopPropagation()}>
      <div className="flex shrink-0 items-center justify-between py-20pxr">
        <h2 id="search-modal-title" className="text-20pxr font-bold">작품 찾기</h2>
        <button type="button" aria-label="검색 닫기" onClick={closeSearchModal} className="p-10pxr"><Close className="h-[15px] w-[15px]" /></button>
      </div>
      <div ref={content} className="min-h-0 overflow-y-auto overscroll-contain">
        <SearchWorkspace compact onNavigate={closeSearchModal} onSearchChange={() => content.current?.scrollTo({ top: 0 })}
          initialState={{ keyword: "", tags: [], orderby: "relevance", page: 1 }} />
      </div>
    </div>
  </div>;
}

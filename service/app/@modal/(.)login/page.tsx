"use client";

import Login from "@/components/login";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Close from "/public/images/close.svg";

export default function LoginPage() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const closeModal = useCallback(() => {
    setIsOpen(false);
    const redirectUrl = searchParams.get("redirect");
    if (redirectUrl) {
      router.push(decodeURIComponent(redirectUrl), { scroll: false });
    } else {
      router.back();
    }
  }, [router, searchParams]);

  useEffect(() => {
    if (searchParams.get("modal") === "open") {
      setIsOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeModal, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) closeModal();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="로그인"
        className="w-full max-w-[440px] max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-[20px] border border-light-gray-400 bg-white shadow-xl"
      >
        <div className="flex justify-end">
          <button
            type="button"
            aria-label="로그인 창 닫기"
            onClick={closeModal}
            className="mr-4 mt-4 rounded-full p-1"
          >
            <Close className="w-[15px] h-[15px]" />
          </button>
        </div>
        <Login
          pageType="modal"
          setIsOpen={() => {
            setIsOpen(false);
          }}
        />
      </div>
    </div>
  );
}

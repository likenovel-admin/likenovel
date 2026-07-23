"use client";

import Login from "@/components/login";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Close from "/public/images/close.svg";

export default function LoginPage() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchParams.get("modal") === "open") {
      setIsOpen(true);
    }
  }, [searchParams]);

  const preventScrollOutside = (e: WheelEvent) => {
    const modal = modalRef.current;
    if (modal && !modal.contains(e.target as Node)) {
      e.preventDefault();
      return;
    }
    if (modal) {
      const isScrollAtTop = modal.scrollTop === 0;
      const isScrollAtBottom =
        modal.scrollTop + modal.clientHeight >= modal.scrollHeight - 1;
      if (
        (isScrollAtTop && e.deltaY < 0) ||
        (isScrollAtBottom && e.deltaY > 0)
      ) {
        e.preventDefault();
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("wheel", preventScrollOutside, {
        passive: false,
      });
    } else {
      window.removeEventListener("wheel", preventScrollOutside);
    }
    return () => {
      window.removeEventListener("wheel", preventScrollOutside);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
    const redirectUrl = searchParams.get("redirect");
    if (redirectUrl) {
      router.push(decodeURIComponent(redirectUrl));
    } else {
      router.back();
    }
  };

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed z-50 flex inset-0 bg-black/50 justify-center items-center p-4"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className={`w-full max-w-[440px] max-h-[calc(100vh-2rem)] bg-white rounded-[20px] border border-light-gray-400 shadow-xl overflow-y-auto
          scrollbar-thin scrollbar-thumb-dark-gray-100 scrollbar-track-white`}
        onClick={handleContentClick}
      >
        <div className="flex justify-end">
          <button
            onClick={() => {
              setIsOpen(!isOpen);
              const redirectUrl = searchParams.get("redirect");
              if (redirectUrl) {
                router.push(decodeURIComponent(redirectUrl), {
                  scroll: false,
                });
              } else {
                router.back();
              }
            }}
            className="mt-4 mr-4"
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

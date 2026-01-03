import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import ExclamationMark from "/public/images/exclamation-mark.svg";

const ExclamationTooltip = () => {
  const [openHelper, setIsOpenHelper] = useState(false);
  return (
    <button
      type="button"
      className={`flex justify-center items-center w-[16px] h-[16px] rounded-full border border-light-gray-600 ${
        openHelper
          ? "bg-black-100 hover:bg-dark-gray-600"
          : "hover:bg-light-gray-100"
      }`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpenHelper(true);
      }}
    >
      <ExclamationMark
        className={`${openHelper ? "text-white" : "text-dark-gray-300"}`}
      />
    </button>
  );
};

export default ExclamationTooltip;

interface Props {
  message?: string;
}

interface Props {
  id: string;
  message?: string;
}

export const ClickExclamationTooltip = ({ id, message }: Props) => {
  const [openHelper, setIsOpenHelper] = useState(false);
  const rootRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setIsOpenHelper(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown, { capture: true });
    return () =>
      window.removeEventListener("pointerdown", onPointerDown, {
        capture: true,
      });
  }, []);

  useEffect(() => {
    const onSomeoneOpened = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string }>).detail;
      if (!detail) return;
      if (detail.id !== id) setIsOpenHelper(false);
    };
    window.addEventListener("tooltip:opened", onSomeoneOpened as EventListener);
    return () =>
      window.removeEventListener(
        "tooltip:opened",
        onSomeoneOpened as EventListener
      );
  }, [id]);

  const toggleOpen = (next: boolean) => {
    setIsOpenHelper(next);
    if (next) {
      window.dispatchEvent(
        new CustomEvent("tooltip:opened", { detail: { id } })
      );
    }
  };

  return (
    <button
      ref={rootRef}
      type="button"
      aria-haspopup="dialog"
      aria-expanded={openHelper}
      className={clsx(
        "relative flex justify-center items-center w-[16px] h-[16px] rounded-full border border-light-gray-600",
        openHelper
          ? "bg-black-100 hover:bg-dark-gray-600"
          : "hover:bg-light-gray-100"
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleOpen(!openHelper);
      }}
    >
      <ExclamationMark
        className={openHelper ? "text-white" : "text-dark-gray-300"}
      />

      {message && openHelper && (
        <div
          className={clsx(
            "absolute z-10 inline-block w-auto min-w-[240px] break-words",
            "rounded-[14px] bg-black-100 text-white leading-[15px] text-12pxr p-7pxr",
            "left-[-28px] top-full mt-2"
          )}
        >
          <span className="block">{message}</span>
          <div className="absolute w-2 h-2 bg-black-100 rotate-45 left-[30px] -top-[3px]" />
        </div>
      )}
    </button>
  );
};

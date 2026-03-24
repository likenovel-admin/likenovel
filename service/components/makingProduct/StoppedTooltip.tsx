import clsx from "clsx";
import { useEffect, useId, useRef, useState } from "react";
import QuestionMark from "/public/images/question-mark.svg";

interface StoppedTooltipProps {
  message?: string;
}

const StoppedTooltip = ({ message }: StoppedTooltipProps) => {
  const generatedId = useId();
  const [openHelper, setIsOpenHelper] = useState(false);
  const rootRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!message) return;

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
  }, [message]);

  useEffect(() => {
    if (!message) return;

    const onSomeoneOpened = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string }>).detail;
      if (!detail) return;
      if (detail.id !== generatedId) {
        setIsOpenHelper(false);
      }
    };

    window.addEventListener("tooltip:opened", onSomeoneOpened as EventListener);
    return () =>
      window.removeEventListener(
        "tooltip:opened",
        onSomeoneOpened as EventListener
      );
  }, [generatedId, message]);

  const toggleOpen = (next: boolean) => {
    setIsOpenHelper(next);
    if (next && message) {
      window.dispatchEvent(
        new CustomEvent("tooltip:opened", { detail: { id: generatedId } })
      );
    }
  };

  return (
    <button
      ref={rootRef}
      type="button"
      aria-haspopup={message ? "dialog" : undefined}
      aria-expanded={message ? openHelper : undefined}
      className={clsx(
        "relative flex justify-center items-center w-[16px] h-[16px] bg-dark-gray-300 rounded-full border border-light-gray-600",
        openHelper
          ? "bg-black-100 hover:bg-dark-gray-600"
          : "hover:bg-light-gray-100"
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (message) {
          toggleOpen(!openHelper);
          return;
        }
        setIsOpenHelper(true);
      }}
    >
      <QuestionMark className={`text-white w-[9px] h-[9px]`} />
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

export default StoppedTooltip;

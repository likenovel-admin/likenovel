import { useEffect } from "react";

export default function useForOutsideClicks({
  element,
  onClose,
}: {
  element: HTMLDivElement | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (element && !element.contains(event.target as Node)) {
        onClose();
      }
    };
    [`click`, `touchstart`].forEach((type) => {
      document.addEventListener(`click`, handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    });
  }, [element]);
}

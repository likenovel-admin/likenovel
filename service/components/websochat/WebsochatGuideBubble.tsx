import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  size?: "default" | "compact";
  className?: string;
}

export default function WebsochatGuideBubble({
  children,
  size = "default",
  className = "",
}: Props) {
  const sizeClass =
    size === "compact"
      ? "rounded-[12px] px-12pxr py-9pxr text-12pxr leading-[1.55]"
      : "rounded-[16px] px-16pxr py-12pxr text-16pxr leading-[1.6]";

  return (
    <div
      className={`${sizeClass} bg-white whitespace-pre-wrap text-dark-gray-500 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

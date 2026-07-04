interface WebsochatButtonProps {
  label: string;
  onClick?: () => void;
  className?: string;
  variant?: "solid" | "subtle";
}

const WebsochatButton = ({
  label,
  onClick,
  className = "",
  variant = "solid",
}: WebsochatButtonProps) => {
  const variantClassName =
    variant === "subtle"
      ? "border border-primary-100 bg-white text-primary-100 hover:bg-light-gray-100 hover:text-primary-200"
      : "border-0 bg-primary-100 text-white hover:bg-primary-200";
  const iconClassName = variant === "subtle" ? "text-primary-100" : "text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center justify-center gap-7pxr whitespace-nowrap rounded-[999px] font-semibold leading-none tracking-[0] transition-colors ${variantClassName} ${className}`}
      aria-label={label}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={`h-16pxr w-16pxr shrink-0 ${iconClassName}`}
        focusable="false"
      >
        <path
          fill="currentColor"
          d="M12 4C7.03 4 3 7.4 3 11.6c0 2.25 1.17 4.27 3.03 5.66l-.39 2.34a.75.75 0 0 0 1.08.78l2.68-1.36c.82.18 1.69.28 2.6.28 4.97 0 9-3.4 9-7.7S16.97 4 12 4Zm-3.35 8.75a1.15 1.15 0 1 1 0-2.3 1.15 1.15 0 0 1 0 2.3Zm3.35 0a1.15 1.15 0 1 1 0-2.3 1.15 1.15 0 0 1 0 2.3Zm3.35 0a1.15 1.15 0 1 1 0-2.3 1.15 1.15 0 0 1 0 2.3Z"
        />
      </svg>
      <span>{label}</span>
    </button>
  );
};

export default WebsochatButton;

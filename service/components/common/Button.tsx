import React, { ButtonHTMLAttributes, forwardRef } from "react";
import Spinner from "./Spinner";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "blueBorder" | "black" | "gray";
  size?: "sm" | "md" | "lg" | "xl";
  isLoading?: boolean;
  className?: string;
}

const Button = (
  {
    variant = "primary",
    size = "md",
    isLoading = false,
    className = "",
    disabled,
    ...props
  }: Props,
  ref: React.Ref<HTMLButtonElement>
) => {
  const baseStyles = `inline-flex items-center justify-center font-medium rounded ${
    disabled && "cursor-not-allowed"
  }`;

  const variantStyles = {
    primary: "text-white bg-primary-100 hover:bg-primary-200",
    secondary: "bg-white border border-light-gray-600 hover:bg-light-gray-100",
    blueBorder: "border border-primary-100 hover:bg-light-gray-100",
    black: "text-white bg-black-100 hover:bg-dark-gray-600",
    gray: "bg-light-gray-200 hover:bg-light-gray-300",
  };

  const sizeStyles = {
    sm: "px-[14px] h-[32px] text-13pxr rounded-[20px]",
    md: "px-[14px] h-[40px] text-14pxr rounded-[10px]",
    lg: "px-[18px] h-[42px] text-14pxr rounded-[20px]",
    xl: "px-[22px] md:h-[52px] text-18pxr rounded-[10px]",
  };

  const buttonClasses = [
    baseStyles,
    variantStyles[variant],
    className,
    sizeStyles[size],
  ].join(" ");

  const spinnerSize = size === "sm" ? 20 : size === "md" || "lg" ? 25 : 30;

  return (
    <button ref={ref} className={buttonClasses} disabled={disabled} {...props}>
      {isLoading ? (
        <Spinner color="#B3B7C3" size={spinnerSize} />
      ) : (
        props.children
      )}
    </button>
  );
};

export default forwardRef(Button);

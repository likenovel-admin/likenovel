"use client";
import useToastStore from "@/store/toastStore";
import { useEffect } from "react";
import CheckCircle from "/public/images/check-circle.svg";
import Check from "/public/images/check.svg";
import Error from "/public/images/error.svg";
import TriangleWarning from "/public/images/triangle-warn.svg";

const Toast = () => {
  const { toasts, removeToast } = useToastStore();

  useEffect(() => {
    const timers = toasts.map((toast) =>
      setTimeout(() => removeToast(toast.id), toast.duration || 2000)
    );

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [toasts, removeToast]);

  const toastStyles = {
    success: "bg-primary-100",
    error: "bg-[#FF9808]",
    confirm: "bg-[#0CA9DC]",
    warning: "bg-red-100",
  };

  const toastIcons = {
    success: (
      <CheckCircle className="w-[18px] h-[18px] mr-2 text-primary-100" />
    ),
    error: <Error className="w-[18px] h-[18px] mr-2" />,
    confirm: <Check className="w-[16px] h-[12px] mr-2 text-white" />,
    warning: (
      <TriangleWarning className="w-[27px] h-[27px] mr-2 text-red-100" />
    ),
  };

  return (
    <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-[9999] space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex justify-center items-center min-w-[250px] md:min-w-[400px] p-4 rounded-[10px] shadow-lg text-white 
            ${toastStyles[toast.type] || "bg-primary-100"}
          `}
        >
          {toast.isShowIcon && toastIcons[toast.type]}
          {toast.message}
        </div>
      ))}
    </div>
  );
};

export default Toast;

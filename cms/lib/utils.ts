import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import Swal from "sweetalert2";
import { ErrorMessages } from "@/constants/errorMessages";
import { ErrorCodes } from "@/enums/errorCodes";
import { differenceInCalendarDays, parseISO, format } from "date-fns";
import { LogoutEventTarget } from "@/lib/auth";

interface ConfirmOptions {
  title?: string;
  text?: string;
  confirm?: string;
  cancel?: string;
  iconHtml?: string;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Example usage for logout:
// import { confirm } from '@/lib/utils';
// confirm({
//   title: '로그아웃 하시겠습니까?',
//   text: '로그아웃 후 다시 로그인해야 합니다.',
//   confirm: '로그아웃',
//   cancel: '취소',
// }).then((result) => {
//   if (result.isConfirmed) {
//     //
//   }
// });

export const confirm = ({
  title = "정말 진행하시겠습니까?",
  text = "이 작업은 되돌릴 수 없습니다!",
  confirm = "확인",
  cancel = "취소",
  iconHtml,
}: ConfirmOptions) => {
  return Swal.fire({
    title: title,
    text: text,
    showCancelButton: true,
    confirmButtonText: confirm,
    cancelButtonText: cancel,
    buttonsStyling: false,
    customClass: {
      popup: "styled-swal-popup",
      confirmButton: "swal-confirm-btn",
      cancelButton: "swal-cancel-btn",
    },
    iconHtml,
    didOpen: () => {
      const style = document.createElement("style");
      style.textContent = `
        .swal-confirm-btn {
          background: #2563eb;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 0.5rem 1.5rem;
          font-weight: 600;
          margin: 0 0.5rem;
          font-size: 1rem;
          transition: background 0.2s;
        }
        .swal-confirm-btn:hover {
          background: #1d4ed8;
        }
        .swal-cancel-btn {
          background: #e5e7eb;
          color: #374151;
          border: none;
          border-radius: 6px;
          padding: 0.5rem 1.5rem;
          font-weight: 600;
          margin: 0 0.5rem;
          font-size: 1rem;
          transition: background 0.2s;
        }
        .swal-cancel-btn:hover {
          background: #d1d5db;
        }
      `;
      document.head.appendChild(style);
    },
  });
};

export const showAlert = (
  title: string = "",
  text: string = "성공",
  confirm: string = "확인",
  popupClass: string = "styled-swal-popup"
) => {
  return Swal.fire({
    title,
    html: text.replace(/\n/g, "<br>"),
    confirmButtonText: confirm,
    buttonsStyling: false,
    customClass: {
      popup: "styled-swal-popup form-height",
      confirmButton: "swal-confirm-btn",
    },
    didOpen: () => {
      const style = document.createElement("style");
      style.textContent = `
        .form-height{
          height: 205px;
        }
        .swal-confirm-btn {
          background: #2563eb;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 0.5rem 1.5rem;
          font-weight: 600;
          margin: 0 0.5rem;
          font-size: 1rem;
          transition: background 0.2s;
        }
        .swal-confirm-btn:hover {
          background: #1d4ed8;
        }
        .swal-cancel-btn {
          background: #e5e7eb;
          color: #374151;
          border: none;
          border-radius: 6px;
          padding: 0.5rem 1.5rem;
          font-weight: 600;
          margin: 0 0.5rem;
          font-size: 1rem;
          transition: background 0.2s;
        }
        .swal-cancel-btn:hover {
          background: #d1d5db;
        }
      `;
      document.head.appendChild(style);
    },
  });
};

export const clearLocalStorage = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  const clearEvent = new Event("logout");
  LogoutEventTarget.dispatchEvent(clearEvent);
};

export const catchErrorMessage = (err: any) => {
  return err?.code ? ErrorMessages[err?.code as ErrorCodes] : err?.message;
};

export const calculatePageCount = (totalCount: number, itemPerPage: number) => {
  return Math.ceil(totalCount / (itemPerPage || 1));
};

export function isPositiveIntegerInput(value: string): boolean {
  return /^\d*$/.test(value);
}

export async function tryCatchWrapper<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

export const daysFromToday = (date: Date | string): number => {
  if (!date) return 0;
  return differenceInCalendarDays(new Date(), new Date(date));
};

export function formatDateRange(start_date: string, end_date: string): string {
  if (!start_date || !end_date) return "";
  const formattedStart = format(parseISO(start_date), "yyyy.MM.dd");
  const formattedEnd = format(parseISO(end_date), "yyyy.MM.dd");
  return `${formattedStart} ~ ${formattedEnd}`;
}

export const isTimeFormatValid = (time: string): boolean => {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
};

export const isValidTimeRange = (start: string, end: string): boolean => {
  if (!start || !end) return false;
  return start < end;
};

export const parseProductIds = (input: string): number[] => {
  if (!input || input.trim() === "") {
    return [];
  }
  return input
    .split(",")
    .map((item) => item.trim())
    .map(Number)
    .filter((id) => Number.isInteger(id) && !isNaN(id));
};

export const getFileName = (
  file: File | string | null,
  defaultName?: string
): string => {
  if (!file) return defaultName || "";
  if (typeof file === "string") {
    return defaultName || "";
  }
  return file.name;
};

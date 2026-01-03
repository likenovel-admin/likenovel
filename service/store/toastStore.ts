import React from "react";
import { create } from "zustand";

type Toast = {
  id: string;
  message: string | React.ReactNode;
  type: "success" | "confirm" | "error" | "warning";
  isShowIcon?: boolean;
  duration?: number;
};

interface IToastState {
  toasts: Toast[];
  setToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const useToastStore = create<IToastState>((set) => ({
  toasts: [],
  setToast: (toast) => {
    const id = new Date().toISOString();
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id, ...toast, isShowIcon: toast.isShowIcon ?? true },
      ],
    }));
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
}));

export default useToastStore;

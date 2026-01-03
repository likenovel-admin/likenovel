import { ReactNode } from "react";
import { create } from "zustand";

interface IConfirmState {
  isOpen: boolean;
  content: ReactNode | null;
  confirmText: ReactNode | null;
  onConfirm?: () => void;
  setConfirm: ({
    content,
    confirmText,
    onConfirm,
    buttonCount,
  }: {
    content: ReactNode;
    confirmText?: ReactNode;
    onConfirm?: () => void;
    buttonCount?: 1 | 2;
  }) => void;
  closeConfirm: () => void;
  buttonCount?: 1 | 2;
}

const useConfirmStore = create<IConfirmState>((set) => ({
  isOpen: false,
  content: null,
  confirmText: null,
  onConfirm: undefined,
  setConfirm: ({ content, confirmText, onConfirm, buttonCount }) =>
    set({
      isOpen: true,
      content,
      confirmText: confirmText || "확인",
      onConfirm,
      buttonCount,
    }),
  closeConfirm: () =>
    set({
      isOpen: false,
      content: null,
      confirmText: null,
      onConfirm: undefined,
    }),
}));

export default useConfirmStore;

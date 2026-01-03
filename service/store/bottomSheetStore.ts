import { ReactNode } from "react";
import { create } from "zustand";

interface IBottomSheetState {
  isOpen: boolean;
  content: ReactNode | null;
  setBottomSheet: (content: ReactNode) => void;
  closeBottomSheet: () => void;
}

const useBottomSheetStore = create<IBottomSheetState>((set) => ({
  isOpen: false,
  content: null,
  setBottomSheet: (content: ReactNode) =>
    set({ isOpen: true, content: content }),
  closeBottomSheet: () => set({ isOpen: false, content: null }),
}));

export default useBottomSheetStore;

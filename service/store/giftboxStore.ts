import { create } from "zustand";

interface IGiftBoxState {
  hasNew: boolean;
  setHasNew: (hasNew: boolean) => void;
}

const useGiftBoxStore = create<IGiftBoxState>((set) => ({
  hasNew: false,
  setHasNew: (isNew: boolean) => set({ hasNew: isNew }),
}));

export default useGiftBoxStore;

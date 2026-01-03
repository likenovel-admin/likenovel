import { create } from "zustand";

interface IModalState {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isScrolled: boolean;
  setScrolled: (scrolled: boolean) => void;
  openSearchModal: () => void;
  closeSearchModal: () => void;
}

const useSearchModalStore = create<IModalState>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen: boolean) => set({ isOpen }),
  isScrolled: false,
  setScrolled: (scrolled: boolean) => set({ isScrolled: scrolled }),
  openSearchModal: () => set({ isOpen: true }),
  closeSearchModal: () => set({ isOpen: false }),
}));

export default useSearchModalStore;

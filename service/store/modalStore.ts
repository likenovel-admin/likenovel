import { ReactNode } from "react";
import { create } from "zustand";

interface IModalState {
  isOpen: boolean;
  typeModal: string;
  typeModalData: any;
  modalContent: ReactNode | null;
  activeModalId: string | null; // Track which Modal instance should render
  registeredModals: Set<string>; // Track all registered modal instances
  setModal: (modalContent: ReactNode) => void;
  closeModal: () => void;
  setTypeModal: (typeModal: string, typeModalData?: any) => void;
  closeTypeModal: () => void;
  registerModal: (modalId: string) => void;
  unregisterModal: (modalId: string) => void;
}

const useModalStore = create<IModalState>((set) => ({
  isOpen: false,
  typeModal: "",
  typeModalData: null,
  modalContent: null,
  activeModalId: null,
  registeredModals: new Set(),
  setModal: (modalContent: ReactNode) =>
    set({ isOpen: true, modalContent: modalContent }),
  closeModal: () => set({ isOpen: false, modalContent: null }),
  setTypeModal: (typeModal: string, typeModalData?: any) =>
    set({ typeModal, typeModalData }),
  closeTypeModal: () => set({ typeModal: "", typeModalData: null }),
  registerModal: (modalId: string) =>
    set((state) => {
      const newRegistered = new Set(state.registeredModals);
      newRegistered.add(modalId);
      return {
        registeredModals: newRegistered,
        // Only set activeModalId if it's not already set (first modal wins)
        activeModalId: state.activeModalId || modalId,
      };
    }),
  unregisterModal: (modalId: string) =>
    set((state) => {
      const newRegistered = new Set(state.registeredModals);
      newRegistered.delete(modalId);
      return {
        registeredModals: newRegistered,
        // Reset activeModalId if this was the active modal and no modals remain
        activeModalId:
          state.activeModalId === modalId && newRegistered.size === 0
            ? null
            : state.activeModalId === modalId
            ? Array.from(newRegistered)[0] || null
            : state.activeModalId,
      };
    }),
}));

export default useModalStore;

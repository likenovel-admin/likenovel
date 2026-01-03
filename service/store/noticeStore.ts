import { INotice } from "@/types";
import { create } from "zustand";

interface INoticeData {
  notice: INotice;
  productTitle: string;
}

interface INoticeState {
  noticeData: INoticeData | null;
  setNoticeData: (notice: INotice, productTitle: string) => void;
  clearNoticeData: () => void;
}

const useNoticeStore = create<INoticeState>((set) => ({
  noticeData: null,
  setNoticeData: (notice: INotice, productTitle: string) =>
    set({ noticeData: { notice, productTitle } }),
  clearNoticeData: () => set({ noticeData: null }),
}));

export default useNoticeStore;

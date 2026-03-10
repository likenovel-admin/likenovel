import { create } from "zustand";

import { IRecommendProduct, ITasteMatch } from "@/app/api/query/recommendation/dto";

export interface IChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  product?: IRecommendProduct;
  tasteMatch?: ITasteMatch;
}

interface IChatState {
  isOpen: boolean;
  isLoading: boolean;
  messages: IChatMessage[];
  excludeIds: number[];
  browsedProductIds: number[];
  browsedTimestamps: number[];
  showBadge: boolean;
  hasDeepRead: boolean;
  setIsOpen: (isOpen: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  addUserMessage: (content: string) => void;
  addAssistantMessage: (payload: {
    content: string;
    product?: IRecommendProduct;
    tasteMatch?: ITasteMatch;
  }) => void;
  addExcludeId: (id: number) => void;
  addBrowsedProduct: (id: number) => void;
  setHasDeepRead: () => void;
  checkBrowsingTrigger: () => void;
  consumeBadge: () => void;
  initFromHistory: (messages: IChatMessage[]) => void;
  clearChat: () => void;
}

const createMessageId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const BROWSING_WINDOW_MS = 10 * 60 * 1000;

const pruneBrowsing = (ids: number[], timestamps: number[]) => {
  const now = Date.now();
  const nextIds: number[] = [];
  const nextTimestamps: number[] = [];
  ids.forEach((id, idx) => {
    const ts = timestamps[idx] ?? 0;
    if (now - ts <= BROWSING_WINDOW_MS) {
      nextIds.push(id);
      nextTimestamps.push(ts);
    }
  });
  return { ids: nextIds, timestamps: nextTimestamps };
};

const useChatStore = create<IChatState>((set) => ({
  isOpen: false,
  isLoading: false,
  messages: [],
  excludeIds: [],
  browsedProductIds: [],
  browsedTimestamps: [],
  showBadge: false,
  hasDeepRead: false,
  setIsOpen: (isOpen: boolean) => set({ isOpen }),
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  addUserMessage: (content: string) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { id: createMessageId(), role: "user", content },
      ],
    })),
  addAssistantMessage: ({ content, product, tasteMatch }) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: createMessageId(),
          role: "assistant",
          content,
          product,
          tasteMatch,
        },
      ],
    })),
  addExcludeId: (id: number) =>
    set((state) => ({
      excludeIds: state.excludeIds.includes(id)
        ? state.excludeIds
        : [...state.excludeIds, id],
    })),
  addBrowsedProduct: (id: number) =>
    set((state) => {
      if (!id || Number.isNaN(id)) {
        return state;
      }
      const { ids, timestamps } = pruneBrowsing(
        state.browsedProductIds,
        state.browsedTimestamps
      );
      const now = Date.now();
      const existsIndex = ids.findIndex((item) => item === id);
      if (existsIndex >= 0) {
        timestamps[existsIndex] = now;
        return {
          browsedProductIds: ids,
          browsedTimestamps: timestamps,
        };
      }
      return {
        browsedProductIds: [...ids, id],
        browsedTimestamps: [...timestamps, now],
      };
    }),
  setHasDeepRead: () => set({ hasDeepRead: true }),
  checkBrowsingTrigger: () =>
    set((state) => {
      const { ids, timestamps } = pruneBrowsing(
        state.browsedProductIds,
        state.browsedTimestamps
      );
      const shouldShowBadge = !state.hasDeepRead && ids.length >= 3;
      return {
        browsedProductIds: ids,
        browsedTimestamps: timestamps,
        showBadge: state.showBadge || shouldShowBadge,
      };
    }),
  consumeBadge: () => set({ showBadge: false }),
  initFromHistory: (history: IChatMessage[]) =>
    set((state) => {
      if (state.messages.length > 0) return state;
      const excludeIds = history
        .filter((msg) => msg.product?.productId)
        .map((msg) => msg.product!.productId);
      return { messages: history, excludeIds };
    }),
  clearChat: () => set({ messages: [], excludeIds: [] }),
}));

export default useChatStore;

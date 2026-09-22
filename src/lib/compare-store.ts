"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_COMPARE = 4;

type CompareState = {
  ids: string[];
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  isFull: (id: string) => boolean;
};

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) =>
        set((state) => {
          if (state.ids.includes(id)) return { ids: state.ids.filter((x) => x !== id) };
          if (state.ids.length >= MAX_COMPARE) return state;
          return { ids: [...state.ids, id] };
        }),
      remove: (id) => set((state) => ({ ids: state.ids.filter((x) => x !== id) })),
      clear: () => set({ ids: [] }),
      isFull: (id) => get().ids.length >= MAX_COMPARE && !get().ids.includes(id),
    }),
    { name: "shop-compare" }
  )
);

export { MAX_COMPARE };

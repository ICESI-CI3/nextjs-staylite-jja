'use client'

import { create } from 'zustand';
import { persist, createJSONStorage, PersistStorage } from 'zustand/middleware';

type ListingStore = {
  favorites: string[]; // ids de listings favoritos
  selectedId: string | null;
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setSelected: (id: string | null) => void;
  clearAll: () => void;
};

const noopStorage: PersistStorage<unknown> = {
  // Firma compatible con PersistStorage<T>
  getItem: async (_name: string) => {
    return null;
  },
  setItem: async (_name: string, _value: unknown) => {
    // no-op
    return;
  },
  removeItem: async (_name: string) => {
    // no-op
    return;
  },
};


const storage: PersistStorage<unknown> = typeof window !== 'undefined'
  ? (createJSONStorage(() => localStorage) as unknown as PersistStorage<unknown>)
  : noopStorage;

export const useListingStore = create<ListingStore>()(
  persist(
    (set) => ({
      favorites: [],
      selectedId: null,
      addFavorite: (id: string) =>
        set((state) => ({ favorites: Array.from(new Set([...state.favorites, id])) })),
      removeFavorite: (id: string) => set((state) => ({ favorites: state.favorites.filter((f) => f !== id) })),
      toggleFavorite: (id: string) =>
        set((state) =>
          state.favorites.includes(id)
            ? { favorites: state.favorites.filter((f) => f !== id) }
            : { favorites: [...state.favorites, id] }
        ),
      setSelected: (id: string | null) => set(() => ({ selectedId: id })),
      clearAll: () => set(() => ({ favorites: [], selectedId: null })),
    }),
    {
      name: 'listing-storage-v1',
      storage,
      version: 1,
    }
  )
);
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NavState {
  isMenuOpen: boolean;
  toggleMenu: () => void;
  openMenu: () => void;
  closeMenu: () => void;
}

export const useNavStore = create<NavState>()(
  persist(
    (set) => ({
      isMenuOpen: false,
      toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
      openMenu: () => set({ isMenuOpen: true }),
      closeMenu: () => set({ isMenuOpen: false }),
    }),
    {
      name: "nav-storage", // Nome da chave no localStorage
      partialize: (state) => ({ isMenuOpen: state.isMenuOpen }), // Salva apenas o que precisa
    }
  )
);

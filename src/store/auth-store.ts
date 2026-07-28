import { create } from "zustand";

/**
 * Auth store — UI-only state.
 * NEVER stores session data, user profile, or any server response.
 */
interface AuthState {
  loadingProvider: "google" | "github" | "credentials" | null;
  setLoadingProvider: (provider: "google" | "github" | "credentials" | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  loadingProvider: null,
  setLoadingProvider: (provider) => set({ loadingProvider: provider }),
}));

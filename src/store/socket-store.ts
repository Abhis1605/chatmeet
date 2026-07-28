import { create } from "zustand";

/**
 * Socket store — UI-only connection status.
 * NEVER stores chat/message/user server data.
 */
interface SocketState {
  isConnected: boolean;
  setConnected: (connected: boolean) => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  isConnected: false,
  setConnected: (connected) => set({ isConnected: connected }),
}));

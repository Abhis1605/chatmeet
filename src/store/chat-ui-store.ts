import { create } from "zustand";

/**
 * Chat UI store — client/UI state ONLY.
 * NEVER stores chats[], messages[], or any server-fetched data.
 *
 * activeChatId replaces the old Zustand selectedChat full-object.
 * Components derive the full chat object from the useChats() TanStack Query
 * cache by finding the chat whose id === activeChatId.
 */
interface ChatUIState {
  activeChatId: string | null;
  activeRoomChatId: string | null;
  activeTab: "personal" | "group" | "room" | "video" | "profile" | "settings";
  sidebarCollapsed: boolean;

  setActiveChatId: (id: string | null) => void;
  setActiveRoomChatId: (id: string | null) => void;
  setActiveTab: (tab: "personal" | "group" | "room" | "video" | "profile" | "settings") => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useChatUIStore = create<ChatUIState>((set) => ({
  activeChatId: null,
  activeRoomChatId: null,
  activeTab: "personal",
  sidebarCollapsed: true,

  setActiveChatId: (id) => set({ activeChatId: id }),
  setActiveRoomChatId: (id) => set({ activeRoomChatId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}));

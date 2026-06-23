import { create } from "zustand";

interface ChatState {
    activeTab: string;
    selectedChat: any;

    setActiveTab: (tab: string) => void;
    setSelectedChat: (chat: any) => void
}

export const useChatStore = create<ChatState>((set) => ({
    activeTab: 'personal',
    selectedChat: null,

    setActiveTab: (tab) => set({ activeTab: tab }),
    setSelectedChat: (chat) => set({ selectedChat: chat })
}))
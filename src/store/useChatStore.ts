import { create } from "zustand";

interface ChatState {
    activeTab: string;
    selectedChat: any;
    chats: any[]

    setActiveTab: (tab: string) => void;
    setSelectedChat: (chat: any) => void

    setChats: (chats: any[]) => void
    addChat: (chat: any) => void
    updateChat: (chat: any) => void
    removeChat: (chatId: string) => void
    updateLastMessage: (msg: any) => void
}

export const useChatStore = create<ChatState>((set) => ({
    activeTab: 'personal',
    selectedChat: null,
    chats: [],

    setActiveTab: (tab) => set({ activeTab: tab }),
    setSelectedChat: (chat) => set({ selectedChat: chat }),

    setChats: (chats) => set({ chats }),
    addChat: (chat) => set((state) => {
        const exists = state.chats.find((c) => c.id === chat.id)
        if (exists) return state

        return {
            chats: [chat, ...state.chats]
        }
    }),
    updateChat: (chat) => set((state) => ({
        chats: state.chats.map((item) => item.id === chat.id ? chat : item),
        selectedChat: state.selectedChat?.id === chat.id ? chat : state.selectedChat
    })),
    removeChat: (chatId) => set((state) => ({
        chats: state.chats.filter((chat) => chat.id !== chatId),
        selectedChat: state.selectedChat?.id === chatId ? null : state.selectedChat
    })),
    updateLastMessage: (msg) =>
  set((state) => ({
    chats: state.chats
      .map((chat) =>
        chat.id === msg.chatId
          ? {
              ...chat,
              messages: [msg],
              updatedAt: new Date(),
            }
          : chat
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() -
          new Date(a.updatedAt).getTime()
      ),
  })),
}))

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  addGroupMember,
  updateGroupMember,
  updateGroupDetails,
  removeGroupMember,
  deleteGroup,
} from "@/services/chat.service";
import { useChatUIStore } from "@/store/chat-ui-store";
import type { ChatDto, ChatMemberRole, UpdateChatDetailsRequest } from "@/types/dto/chat.dto";
import { showError, showSuccess } from "@/lib/toast";

/**
 * Shared helper: update the 'group' chat list cache with the updated chat
 */
function updateChatInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  updatedChat: ChatDto
) {
  queryClient.setQueryData<ChatDto[]>(
    queryKeys.chats.list("group"),
    (prev) => {
      if (!prev) return prev;
      return prev.map((c) => (c.id === updatedChat.id ? updatedChat : c));
    }
  );
}

/** useAddGroupMember */
export function useAddGroupMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId, userId }: { chatId: string; userId: string }) =>
      addGroupMember(chatId, userId),

    onSuccess: (updatedChat) => {
      updateChatInCache(queryClient, updatedChat);
      showSuccess("Member added");
    },

    onError: () => showError("Failed to add member"),
  });
}

/** useUpdateGroupMember */
export function useUpdateGroupMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chatId,
      memberId,
      role,
      canSend,
    }: {
      chatId: string;
      memberId: string;
      role?: ChatMemberRole;
      canSend?: boolean;
    }) => updateGroupMember(chatId, memberId, { role, canSend }),

    onSuccess: (updatedChat) => {
      updateChatInCache(queryClient, updatedChat);
    },

    onError: () => showError("Failed to update member"),
  });
}

/** useUpdateGroupDetails */
export function useUpdateGroupDetails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId, ...body }: { chatId: string } & UpdateChatDetailsRequest) =>
      updateGroupDetails(chatId, body),

    onSuccess: (updatedChat) => {
      updateChatInCache(queryClient, updatedChat);
      showSuccess("Group updated");
    },

    onError: () => showError("Failed to update group"),
  });
}

/** useRemoveGroupMember */
export function useRemoveGroupMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId, memberId }: { chatId: string; memberId: string }) =>
      removeGroupMember(chatId, memberId),

    onSuccess: (updatedChat) => {
      updateChatInCache(queryClient, updatedChat);
      showSuccess("Member removed");
    },

    onError: () => showError("Failed to remove member"),
  });
}

/** useDeleteGroup */
export function useDeleteGroup() {
  const queryClient = useQueryClient();
  const { activeChatId, setActiveChatId } = useChatUIStore();

  return useMutation({
    mutationFn: ({ chatId }: { chatId: string }) => deleteGroup(chatId),

    onSuccess: (result, { chatId }) => {
      if (!result.success) {
        showError("Could not delete group");
        return;
      }

      // Remove from cache
      queryClient.setQueryData<ChatDto[]>(
        queryKeys.chats.list("group"),
        (prev) => {
          if (!prev) return prev;
          return prev.filter((c) => c.id !== chatId);
        }
      );

      // Deselect if this was the active chat
      if (activeChatId === chatId) {
        setActiveChatId(null);
      }

      showSuccess("Group deleted");
    },

    onError: () => showError("Failed to delete group"),
  });
}

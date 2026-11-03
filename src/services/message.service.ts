import apiClient from "@/lib/axios";
import type { MessageDto, MessagesPage, ThreadPage } from "@/types/dto/message.dto";

/**
 * Message service — pure axios functions, no React imports.
 */

export async function fetchMessages(
  chatId: string,
  cursor?: string
): Promise<MessagesPage> {
  const { data } = await apiClient.get<MessagesPage>(`/message/${chatId}`, {
    params: cursor ? { cursor } : undefined,
  });
  return data;
}

export async function fetchThread(
  chatId: string,
  messageId: string
): Promise<ThreadPage> {
  const { data } = await apiClient.get<ThreadPage>(
    `/message/${chatId}/thread/${messageId}`
  );
  return data;
}

export async function updateMessage(chatId: string, messageId: string, content: string) {
  const { data } = await apiClient.patch(`/message/${chatId}`, { messageId, content });
  return data.message;
}

export async function deleteMessage(chatId: string, messageId: string) {
  await apiClient.delete(`/message/${chatId}`, { params: { messageId } });
}

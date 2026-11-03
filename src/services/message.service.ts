import apiClient from "@/lib/axios";
import type { MessageDto, MessagesPage, ThreadPage } from "@/types/dto/message.dto";

/**
 * Message service — pure axios functions, no React imports.
 */

export interface MessageSearchResult {
  id: string;
  content: string | null;
  type: MessageDto["type"];
  fileName: string | null;
  senderId: string;
  createdAt: string;
  sender: MessageDto["sender"];
}

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

export async function searchMessages(
  chatId: string,
  query: string
): Promise<MessageSearchResult[]> {
  const { data } = await apiClient.get<{ messages: MessageSearchResult[] }>(
    `/message/${chatId}/search`,
    { params: { q: query } }
  );
  return data.messages;
}

export async function fetchPinnedMessages(chatId: string): Promise<MessageDto[]> {
  const { data } = await apiClient.get<{ messages: MessageDto[] }>(
    `/message/${chatId}/pinned`
  );
  return data.messages;
}

export async function pinMessage(
  chatId: string,
  messageId: string,
  pinned: boolean
): Promise<MessageDto> {
  const { data } = await apiClient.post<{ message: MessageDto }>(
    `/message/${chatId}/pin`,
    { messageId, pinned }
  );
  return data.message;
}

export async function forwardMessage(
  chatId: string,
  messageId: string,
  targetChatIds: string[]
): Promise<MessageDto[]> {
  const { data } = await apiClient.post<{ messages: MessageDto[] }>(
    `/message/${chatId}/forward`,
    { messageId, targetChatIds }
  );
  return data.messages;
}

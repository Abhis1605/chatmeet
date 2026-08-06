import apiClient from "@/lib/axios";
import type { MessagesPage } from "@/types/dto/message.dto";

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

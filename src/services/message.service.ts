import apiClient from "@/lib/axios";
import type { MessageDto } from "@/types/dto/message.dto";

/**
 * Message service — pure axios functions, no React imports.
 */

export async function fetchMessages(chatId: string): Promise<MessageDto[]> {
  const { data } = await apiClient.get<MessageDto[]>(`/message/${chatId}`);
  return data;
}

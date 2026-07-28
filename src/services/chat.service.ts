import apiClient from "@/lib/axios";
import type {
  ChatDto,
  CreateDirectChatRequest,
  CreateGroupChatRequest,
  DeleteGroupResponse,
  UpdateGroupMemberRequest,
} from "@/types/dto/chat.dto";

/**
 * Chat service — pure axios functions, no React imports.
 * Matches existing API route signatures exactly (read from src/app/api/**).
 */

// GET /api/chat/list?type=personal|group
export async function fetchChats(type: string): Promise<ChatDto[]> {
  const { data } = await apiClient.get<ChatDto[]>(`/chat/list?type=${type}`);
  return data;
}

// POST /api/chat/create — body: { userId, targetUserId }
// NOTE: userId is the current user's id (session.user.id), targetUserId is who to chat with
export async function createDirectChat(
  userId: string,
  targetUserId: string
): Promise<ChatDto> {
  const { data } = await apiClient.post<ChatDto>("/chat/create", {
    userId,
    targetUserId,
  } satisfies CreateDirectChatRequest);
  return data;
}

// POST /api/group — body: { name, memberIds }
export async function createGroupChat(
  name: string,
  memberIds: string[]
): Promise<ChatDto> {
  const { data } = await apiClient.post<ChatDto>("/group", {
    name,
    memberIds,
  } satisfies CreateGroupChatRequest);
  return data;
}

// POST /api/group/:chatId/members — body: { userId }
export async function addGroupMember(
  chatId: string,
  userId: string
): Promise<ChatDto> {
  const { data } = await apiClient.post<ChatDto>(
    `/group/${chatId}/members`,
    { userId }
  );
  return data;
}

// PATCH /api/group/:chatId/members — body: { memberId, role?, canSend? }
export async function updateGroupMember(
  chatId: string,
  memberId: string,
  body: Omit<UpdateGroupMemberRequest, "memberId">
): Promise<ChatDto> {
  const { data } = await apiClient.patch<ChatDto>(
    `/group/${chatId}/members`,
    { memberId, ...body }
  );
  return data;
}

// DELETE /api/group/:chatId/members?memberId=...
export async function removeGroupMember(
  chatId: string,
  memberId: string
): Promise<ChatDto> {
  const { data } = await apiClient.delete<ChatDto>(
    `/group/${chatId}/members?memberId=${memberId}`
  );
  return data;
}

// DELETE /api/group/:chatId
export async function deleteGroup(
  chatId: string
): Promise<DeleteGroupResponse> {
  const { data } = await apiClient.delete<DeleteGroupResponse>(
    `/group/${chatId}`
  );
  return data;
}

// POST /api/chat/:chatId/read
export async function markChatAsRead(chatId: string): Promise<{ success: boolean }> {
  const { data } = await apiClient.post<{ success: boolean }>(`/chat/${chatId}/read`);
  return data;
}


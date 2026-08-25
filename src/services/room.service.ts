import apiClient from "@/lib/axios";
import type { RoomDto, RoomMemberDto } from "@/types/dto/room.dto";
import type { UpdateChatDetailsRequest } from "@/types/dto/chat.dto";

/**
 * room.service.ts — pure axios functions for Room feature.
 * Completely independent of chat.service.ts — no shared exports touched.
 */

// POST /api/room — { name }
export async function createRoom(name: string): Promise<RoomDto> {
  const { data } = await apiClient.post<RoomDto>("/room", { name });
  return data;
}

// POST /api/room/join — { roomCode }
export async function joinRoomByCode(roomCode: string): Promise<RoomDto> {
  const { data } = await apiClient.post<RoomDto>("/room/join", { roomCode });
  return data;
}

// POST /api/room/:chatId/leave
export async function leaveRoom(chatId: string): Promise<{ success: boolean }> {
  const { data } = await apiClient.post<{ success: boolean }>(`/room/${chatId}/leave`);
  return data;
}

// PATCH /api/room/:chatId — { name?, image? }
export async function updateRoomDetails(
  chatId: string,
  body: UpdateChatDetailsRequest
): Promise<RoomDto> {
  const { data } = await apiClient.patch<RoomDto>(`/room/${chatId}`, body);
  return data;
}

// DELETE /api/room/:chatId
export async function deleteRoom(chatId: string): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete<{ success: boolean }>(`/room/${chatId}`);
  return data;
}

// POST /api/room/:chatId/regenerate-code
export async function regenerateRoomCode(chatId: string): Promise<{ roomCode: string }> {
  const { data } = await apiClient.post<{ roomCode: string }>(`/room/${chatId}/regenerate-code`);
  return data;
}

// PATCH /api/room/:chatId/code-active — { active }
export async function setRoomCodeActive(
  chatId: string,
  active: boolean
): Promise<{ roomCodeActive: boolean }> {
  const { data } = await apiClient.patch<{ roomCodeActive: boolean }>(
    `/room/${chatId}/code-active`,
    { active }
  );
  return data;
}

// GET /api/room/:chatId/members
export async function fetchRoomMembers(chatId: string): Promise<RoomMemberDto[]> {
  const { data } = await apiClient.get<RoomMemberDto[]>(`/room/${chatId}/members`);
  return data;
}

// GET /api/room/list (via chat/list?type=room)
export async function fetchRooms(): Promise<RoomDto[]> {
  const { data } = await apiClient.get<RoomDto[]>("/chat/list?type=room");
  return data;
}

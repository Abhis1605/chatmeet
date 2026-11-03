import apiClient from "@/lib/axios";
import type { PendingInviteDto } from "@/types/dto/room.dto";

/**
 * invite.service.ts — pure axios functions for Room invites.
 * Completely independent of chat.service.ts.
 */

export interface SendInviteResponse {
  success: boolean;
  emailSent?: boolean;
  warning?: string;
  inviteId?: string;
}

// POST /api/room/:chatId/invite — { invitedUserId?, email? }
export async function sendInvite(
  chatId: string,
  payload: { invitedUserId?: string; email?: string }
): Promise<SendInviteResponse> {
  const { data } = await apiClient.post<SendInviteResponse>(
    `/room/${chatId}/invite`,
    payload
  );
  return data;
}

// POST /api/room/invite/:inviteId/respond — { action: 'accept' | 'reject' }
export async function respondToInvite(
  inviteId: string,
  action: "accept" | "reject"
): Promise<{ success: boolean }> {
  const { data } = await apiClient.post<{ success: boolean }>(
    `/room/invite/${inviteId}/respond`,
    { action }
  );
  return data;
}

// DELETE /api/room/invite/:inviteId
export async function cancelInvite(inviteId: string): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete<{ success: boolean }>(`/room/invite/${inviteId}`);
  return data;
}

// GET /api/invites/pending
export async function fetchPendingInvites(): Promise<PendingInviteDto[]> {
  const { data } = await apiClient.get<PendingInviteDto[]>("/invites/pending");
  return data;
}

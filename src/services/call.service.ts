import apiClient from "@/lib/axios";
import type {
  CallHistoryPageDto,
  CallSessionDto,
  CallTokenResponse,
  StartCallResponse,
} from "@/types/dto/call.dto";

/**
 * Call service — pure axios functions, no React imports.
 * Matches existing API route signatures exactly (read from src/app/api/call/**).
 */

// POST /api/call/start — body: { chatId, type? }
export async function startCall(
  chatId: string,
  type: "ONE_TO_ONE" | "GROUP" = "ONE_TO_ONE"
): Promise<StartCallResponse> {
  const { data } = await apiClient.post<StartCallResponse>("/call/start", {
    chatId,
    type,
  });
  return data;
}

// GET /api/call/active/:chatId
export async function fetchActiveCall(
  chatId: string
): Promise<CallSessionDto | null> {
  const { data } = await apiClient.get<{ callSession: CallSessionDto | null }>(
    `/call/active/${chatId}`
  );
  return data.callSession;
}

// POST /api/call/:sessionId/token
export async function getCallToken(
  sessionId: string
): Promise<CallTokenResponse> {
  const { data } = await apiClient.post<CallTokenResponse>(
    `/call/${sessionId}/token`
  );
  return data;
}

// POST /api/call/:sessionId/end
export async function endCall(sessionId: string): Promise<CallSessionDto> {
  const { data } = await apiClient.post<{ callSession: CallSessionDto }>(
    `/call/${sessionId}/end`
  );
  return data.callSession;
}

// POST /api/call/:sessionId/leave
export async function leaveCall(sessionId: string): Promise<CallSessionDto> {
  const { data } = await apiClient.post<{ callSession: CallSessionDto }>(
    `/call/${sessionId}/leave`
  );
  return data.callSession;
}

// POST /api/call/:sessionId/reject
export async function rejectCall(sessionId: string): Promise<CallSessionDto> {
  const { data } = await apiClient.post<{ callSession: CallSessionDto }>(
    `/call/${sessionId}/reject`
  );
  return data.callSession;
}

// GET /api/call/history?cursor=...
export async function fetchCallHistory(
  cursor?: string | null
): Promise<CallHistoryPageDto> {
  const { data } = await apiClient.get<CallHistoryPageDto>("/call/history", {
    params: cursor ? { cursor } : undefined,
  });
  return data;
}

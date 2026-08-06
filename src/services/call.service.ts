import apiClient from "@/lib/axios";
import type {
  CallSessionDto,
  CallTokenResponse,
  StartCallResponse,
} from "@/types/dto/call.dto";

/**
 * Call service — pure axios functions, no React imports.
 * Matches existing API route signatures exactly (read from src/app/api/call/**).
 */

// POST /api/call/start — body: { chatId }
export async function startCall(chatId: string): Promise<StartCallResponse> {
  const { data } = await apiClient.post<StartCallResponse>("/call/start", {
    chatId,
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

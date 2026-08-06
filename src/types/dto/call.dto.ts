export interface CallSessionDto {
  id: string;
  chatId: string;
  hmsRoomId: string;
  status: string;
  startedById: string;
  startedAt: string;
  endedAt?: string | null;
}

export interface StartCallResponse {
  callSessionId: string;
  hmsRoomId: string;
  status: string;
}

export interface CallTokenResponse {
  token: string;
  hmsRoomId: string;
  userName: string;
}

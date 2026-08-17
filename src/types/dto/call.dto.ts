export interface CallSessionDto {
  id: string;
  chatId: string;
  hmsRoomId: string;
  type: "ONE_TO_ONE" | "GROUP" | string;
  status: string;
  startedById: string;
  startedAt: string;
  endedAt?: string | null;
}

export interface StartCallResponse {
  callSessionId: string;
  hmsRoomId: string;
  status: string;
  type: "ONE_TO_ONE" | "GROUP" | string;
}

export interface CallTokenResponse {
  token: string;
  hmsRoomId: string;
  userName: string;
}

// ── Call History DTOs (additive) ─────────────────────────────────────────────

export interface CallHistoryParticipantDto {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  image: string | null;
  status: string;
  joinedAt: string | null;
  leftAt: string | null;
  isStarter: boolean;
}

export interface CallHistoryItemDto {
  id: string;
  chatId: string;
  chatName: string | null;
  displayName: string;
  hmsRoomId: string;
  type: "ONE_TO_ONE" | "GROUP" | string;
  status: string;
  outcome: "Completed" | "Missed" | "Declined" | "Active";
  startedById: string;
  startedByName: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  participants: CallHistoryParticipantDto[];
}

export interface CallHistoryPageDto {
  calls: CallHistoryItemDto[];
  nextCursor: string | null;
}

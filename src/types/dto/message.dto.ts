import type { UserDto } from "./user.dto";

export type MessageType = "TEXT" | "IMAGE" | "VIDEO" | "FILE";

// Full message shape returned by /api/message/:chatId (includes sender)
export interface MessageDto {
  id: string;
  content: string | null;
  type: MessageType;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  senderId: string;
  chatId: string;
  sender: UserDto;
  createdAt: string;
}

// Shape emitted by socket 'send-message' event
export interface SendMessagePayload {
  chatId: string;
  type: MessageType;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}

// Optimistic message appended to cache before socket confirmation
export interface OptimisticMessage extends MessageDto {
  _isOptimistic: true;
}

// One page of the cursor-paginated /api/message/:chatId response
export interface MessagesPage {
  messages: MessageDto[];
  nextCursor: string | null;
}

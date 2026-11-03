import type { UserDto } from "./user.dto";

export type MessageType = "TEXT" | "IMAGE" | "VIDEO" | "FILE";

// Compact snapshot of the message a reply is quoting.
export interface MessageParentDto {
  id: string;
  content: string | null;
  type: MessageType;
  fileName: string | null;
  senderId: string;
  sender: UserDto;
  createdAt: string;
}

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
  parentId: string | null;
  parent?: MessageParentDto | null;
  _count?: { replies: number };
  sender: UserDto;
  createdAt: string;
  updatedAt?: string;
}

export interface ThreadPage {
  parent: MessageDto;
  replies: MessageDto[];
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
  parentId?: string;
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

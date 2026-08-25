import type { UserDto } from "./user.dto";

// Mirrors Prisma ChatMemberRole enum
export type ChatMemberRole = "CREATOR" | "ADMIN" | "MEMBER";

// ChatMember as returned by Prisma with user included
export interface ChatMemberDto {
  id: string;
  userId: string;
  chatId: string;
  role: ChatMemberRole;
  canSend: boolean;
  user: UserDto;
}

// Message included in chat list (take: 1)
export interface ChatLastMessage {
  id: string;
  content: string | null;
  senderId: string;
  type: "TEXT" | "IMAGE" | "VIDEO" | "FILE";
  createdAt: string;
}

// Full chat shape returned by /api/chat/list and /api/chat/create
export interface ChatDto {
  id: string;
  name: string | null;
  image: string | null;
  isGroup: boolean;
  unreadCount?: number;
  members: ChatMemberDto[];
  lastMessage?: ChatLastMessage;
  createdAt: string;
  updatedAt: string;
}


// /api/chat/create request body
export interface CreateDirectChatRequest {
  userId: string;
  targetUserId: string;
}

// /api/group POST request body
export interface CreateGroupChatRequest {
  name: string;
  memberIds: string[];
}

// /api/group/:chatId/members POST request body
export interface AddGroupMemberRequest {
  userId: string;
}

// /api/group/:chatId/members PATCH request body
export interface UpdateGroupMemberRequest {
  memberId: string;
  role?: ChatMemberRole;
  canSend?: boolean;
}

// /api/group/:chatId DELETE response
export interface DeleteGroupResponse {
  success: boolean;
}

// /api/group/:chatId and /api/room/:chatId PATCH request body
export interface UpdateChatDetailsRequest {
  name?: string;
  image?: string;
}

import type { UserDto } from "./user.dto";

/**
 * room.dto.ts — Type shapes returned by Room API routes.
 * Separate from chat.dto.ts — ChatDto/GroupDto untouched.
 */

export type RoomMemberRole = "CREATOR" | "MEMBER";

export interface RoomMemberDto {
  id: string;
  userId: string;
  chatId: string;
  role: RoomMemberRole;
  user: UserDto;
}

export interface RoomDto {
  id: string;
  name: string;
  image: string | null;
  isRoom: true;
  isGroup: false;
  roomCode: string | null;
  roomCodeActive: boolean;
  members: RoomMemberDto[];
  lastMessage?: {
    id: string;
    content: string | null;
    senderId: string;
    type: "TEXT" | "IMAGE" | "VIDEO" | "FILE";
    createdAt: string;
  } | null;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PendingInviteDto {
  id: string;
  chatId: string;
  chat: { id: string; name: string };
  invitedById: string;
  invitedBy: Pick<UserDto, "id" | "name" | "image" | "profilePhotoType" | "avatarFilename" | "email">;
  invitedUserId: string;
  status: "PENDING";
  createdAt: string;
}

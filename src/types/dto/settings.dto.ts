// Full settings shape returned by GET /api/user/settings
export interface SettingsDto {
  theme: "LIGHT" | "DARK" | "SYSTEM";
  enterToSend: boolean;
  readReceiptsEnabled: boolean;
  showTypingIndicator: boolean;
  notificationSound: boolean;
  notificationToast: boolean;
  notificationsMuted: boolean;
}

// PATCH /api/user/settings request body — all fields optional, only sent ones are updated
export interface UpdateSettingsRequest {
  theme?: "LIGHT" | "DARK" | "SYSTEM";
  enterToSend?: boolean;
  readReceiptsEnabled?: boolean;
  showTypingIndicator?: boolean;
  notificationSound?: boolean;
  notificationToast?: boolean;
  notificationsMuted?: boolean;
}

export interface UpdateSettingsResponse {
  settings?: SettingsDto;
  error?: string;
}

// Blocked users
export interface BlockedUserDto {
  id: string;
  blockedId: string;
  name: string | null;
  username: string | null;
  image: string | null;
  createdAt: string;
}

export interface UnblockUserResponse {
  success?: boolean;
  error?: string;
}

// Account deletion
export interface DeleteAccountRequest {
  confirmation: string;
}

export interface DeleteAccountResponse {
  success?: boolean;
  error?: string;
}

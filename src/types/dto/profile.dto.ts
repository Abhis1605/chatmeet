// Full profile shape returned by GET /api/user/profile
export interface ProfileDto {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  bio: string | null;
  image: string | null;
  provider: string;
  profilePhotoType: "PHOTO" | "AVATAR";
  avatarFilename: string | null;
  statusPreference: "ONLINE" | "AWAY" | "DND" | "INVISIBLE";
  showLastSeen: boolean;
  showOnlineStatus: boolean;
  isOnline: boolean;
  lastSeen: string | null;
  createdAt: string;
}

// PATCH /api/user/profile request body — all fields optional, only sent ones are updated
export interface UpdateProfileRequest {
  name?: string;
  username?: string;
  bio?: string;
  profilePhotoType?: "PHOTO" | "AVATAR";
  avatarFilename?: string;
  imageUrl?: string;
  statusPreference?: "ONLINE" | "AWAY" | "DND" | "INVISIBLE";
  showLastSeen?: boolean;
  showOnlineStatus?: boolean;
}

export interface UpdateProfileResponse {
  profile?: ProfileDto;
  error?: string;
}

// POST /api/user/change-password request body
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success?: boolean;
  error?: string;
}

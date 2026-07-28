// Mirrors the User select shape returned by /api/user/search
export interface UserSearchResult {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  isOnline: boolean;
  lastSeen: string | null;
}

// Full user shape (included via Prisma relations — e.g. chat members)
export interface UserDto {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  isOnline: boolean;
  lastSeen: string | null;
  provider: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// /api/user/update request body
export interface UpdateProfileRequest {
  email: string;
  name?: string;
  image?: string;
}

// /api/user/update response
export interface UpdateProfileResponse {
  success: boolean;
}

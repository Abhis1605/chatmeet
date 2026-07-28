import apiClient from "@/lib/axios";
import type { UserSearchResult, UpdateProfileRequest, UpdateProfileResponse } from "@/types/dto/user.dto";

/**
 * User service — pure axios functions, no React imports.
 */

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const { data } = await apiClient.get<UserSearchResult[]>(`/user/search?email=${query}`);
  return data;
}

export async function updateProfile(email: string, name?: string, image?: string): Promise<UpdateProfileResponse> {
  const { data } = await apiClient.post<UpdateProfileResponse>("/user/update", {
    email,
    name,
    image,
  } satisfies UpdateProfileRequest);
  return data;
}

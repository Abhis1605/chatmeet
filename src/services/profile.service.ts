import apiClient from "@/lib/axios";
import type {
  ProfileDto,
  UpdateProfileRequest,
  UpdateProfileResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
} from "@/types/dto/profile.dto";

export async function getProfile(): Promise<ProfileDto> {
  const { data } = await apiClient.get<{ profile: ProfileDto }>("/user/profile");
  return data.profile;
}

export async function updateProfile(payload: UpdateProfileRequest): Promise<UpdateProfileResponse> {
  const { data } = await apiClient.patch<UpdateProfileResponse>("/user/profile", payload satisfies UpdateProfileRequest);
  return data;
}

export async function changePassword(payload: ChangePasswordRequest): Promise<ChangePasswordResponse> {
  const { data } = await apiClient.post<ChangePasswordResponse>(
    "/user/change-password",
    payload satisfies ChangePasswordRequest,
  );
  return data;
}

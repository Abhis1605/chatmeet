import apiClient from "@/lib/axios";
import type {
  SettingsDto,
  UpdateSettingsRequest,
  UpdateSettingsResponse,
  BlockedUserDto,
  UnblockUserResponse,
  DeleteAccountRequest,
  DeleteAccountResponse,
} from "@/types/dto/settings.dto";

export async function getSettings(): Promise<SettingsDto> {
  const { data } = await apiClient.get<{ settings: SettingsDto }>("/user/settings");
  return data.settings;
}

export async function updateSettings(payload: UpdateSettingsRequest): Promise<UpdateSettingsResponse> {
  const { data } = await apiClient.patch<UpdateSettingsResponse>("/user/settings", payload satisfies UpdateSettingsRequest);
  return data;
}

export async function getBlockedUsers(): Promise<BlockedUserDto[]> {
  const { data } = await apiClient.get<{ blockedUsers: BlockedUserDto[] }>("/user/blocked");
  return data.blockedUsers;
}

export async function unblockUser(blockedId: string): Promise<UnblockUserResponse> {
  const { data } = await apiClient.delete<UnblockUserResponse>(`/user/blocked/${blockedId}`);
  return data;
}

export async function deleteAccount(payload: DeleteAccountRequest): Promise<DeleteAccountResponse> {
  const { data } = await apiClient.post<DeleteAccountResponse>(
    "/user/delete-account",
    payload satisfies DeleteAccountRequest,
  );
  return data;
}

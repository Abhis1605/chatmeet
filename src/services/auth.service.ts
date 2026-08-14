import apiClient from "@/lib/axios";
import type {
  RegisterRequest,
  RegisterResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  ResendOtpRequest,
  ResendOtpResponse,
  LogoutResponse,
} from "@/types/dto/auth.dto";

/**
 * Auth service — pure axios functions, no React imports.
 * Login is intentionally NOT here; it correctly uses next-auth signIn().
 */

export async function registerUser(
  email: string,
  password: string
): Promise<RegisterResponse> {
  const { data } = await apiClient.post<RegisterResponse>(
    "/auth/register",
    { email, password } satisfies RegisterRequest
  );
  return data;
}

export async function verifyOtp(
  email: string,
  otp: string
): Promise<VerifyOtpResponse> {
  const { data } = await apiClient.post<VerifyOtpResponse>(
    "/auth/verify-otp",
    { email, otp } satisfies VerifyOtpRequest
  );
  return data;
}

export async function resendOtp(
  email: string
): Promise<ResendOtpResponse> {
  const { data } = await apiClient.post<ResendOtpResponse>(
    "/auth/resend-otp",
    { email } satisfies ResendOtpRequest
  );
  return data;
}

export async function logoutUser(): Promise<LogoutResponse> {
  const { data } = await apiClient.post<LogoutResponse>("/auth/logout");
  return data;
}

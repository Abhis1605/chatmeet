// /api/auth/register request body
export interface RegisterRequest {
  email: string;
  password: string;
}

// /api/auth/register response
export interface RegisterResponse {
  success?: boolean;
  error?: string;
}

// /api/auth/verify-otp request body
export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

// /api/auth/verify-otp response
export interface VerifyOtpResponse {
  success?: boolean;
  error?: string;
}

// /api/auth/resend-otp request body
export interface ResendOtpRequest {
  email: string;
}

// /api/auth/resend-otp response
export interface ResendOtpResponse {
  success?: boolean;
  error?: string;
}

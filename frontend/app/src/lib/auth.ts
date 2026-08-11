import { api } from "./axios";

export type AuthRole = "OWNER" | "MANAGER" | "CASHIER" | "WAITER" | "STAFF";

export type AuthUser = {
  id: string;
  role: AuthRole;
  email?: string;
  username?: string;
  fullName?: string;
};

export type AuthResponse = {
  message?: string;
  user: AuthUser;
};

export type ForgotPasswordPayload = {
  email: string;
  phone: string;
  username: string;
};

export type ForgotPasswordResponse = {
  message: string;
  temporaryPassword?: string;
};

function getApiMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response
      ?.data?.message === "string"
  ) {
    return (error as { response: { data: { message: string } } }).response.data
      .message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Request failed";
}

export async function login(payload: {
  identifier: string;
  password: string;
}): Promise<AuthResponse> {
  try {
    const res = await api.post<AuthResponse>("/auth/login", {
      emailOrUsername: payload.identifier,
      password: payload.password,
    });

    return res.data;
  } catch (error) {
    throw new Error(getApiMessage(error));
  }
}

export async function forgotPassword(
  payload: ForgotPasswordPayload
): Promise<ForgotPasswordResponse> {
  try {
    const res = await api.post<ForgotPasswordResponse>(
      "/auth/forgot-password",
      {
        email: payload.email,
        phone: payload.phone,
        username: payload.username,
      }
    );

    return res.data;
  } catch (error) {
    throw new Error(getApiMessage(error));
  }
}

export async function verify(): Promise<AuthResponse> {
  try {
    const res = await api.get<AuthResponse>("/auth/verify");
    return res.data;
  } catch (error) {
    throw new Error(getApiMessage(error));
  }
}

export async function logout(): Promise<{ message: string }> {
  try {
    const res = await api.post<{ message: string }>("/auth/logout");
    return res.data;
  } catch (error) {
    throw new Error(getApiMessage(error));
  }
}
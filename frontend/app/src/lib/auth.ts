import { api } from "./axios";

export type LoginPayload = {
  identifier: string; 
  password: string;
};

export type LoginResponse = {
  user: {
    id: string;
    role: "OWNER" | "MANAGER" | "CASHIER" | "WAITER" | "STAFF";
    email?: string;
    username?: string;
    fullName?: string;
  };
};

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>("/auth/login", {
    emailOrUsername: payload.identifier,
    password: payload.password,
  });
  return res.data;
}

export async function logout(): Promise<{ message: string }> {
  const res = await api.post("/auth/logout");
  return res.data;
}

export async function verify() {
  const res = await api.get("/auth/verify");
  return res.data;
}
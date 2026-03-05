import { api } from "../axios";
import type { Staff } from "../../types/staff";

export async function getAllStaff(): Promise<Staff[]> {
  const res = await api.get<Staff[]>("/staff");
  return res.data;
}

export async function createStaff(payload: {
  fullName: string;
  email?: string;
  username?: string;
  password: string;
  role: "OWNER" | "MANAGER" | "CASHIER" | "WAITER" | "STAFF";
  phone?: string;
  salary?: number;
  dob?: string;
  shiftStart?: string;
  shiftEnd?: string;
  address?: string;
  additionalDetails?: string;
}) {
  const res = await api.post("/staff", payload);
  return res.data;
}

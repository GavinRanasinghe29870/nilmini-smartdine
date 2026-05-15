import { api } from "../axios";
import type {
  AttendanceStatus,
  PaySalaryPayload,
  SalaryPayment,
  Staff,
  StaffAttendance,
} from "../../types/staff";

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

export async function getAttendanceByDate(
  date: string
): Promise<StaffAttendance[]> {
  const res = await api.get<StaffAttendance[]>("/staff/attendance", {
    params: { date },
  });

  return res.data;
}

export async function updateStaffAttendance(payload: {
  staffId: string;
  date: string;
  status: AttendanceStatus;
  shiftStart?: string;
  shiftEnd?: string;
}): Promise<StaffAttendance> {
  const res = await api.put<StaffAttendance>("/staff/attendance", payload);
  return res.data;
}

export async function payStaffSalary(
  staffId: string,
  payload: PaySalaryPayload
): Promise<SalaryPayment> {
  const res = await api.post<{ message: string; payment: SalaryPayment }>(
    `/staff/${staffId}/pay-salary`,
    payload
  );

  return res.data.payment;
}

export async function getSalaryPayments(
  staffId?: string
): Promise<SalaryPayment[]> {
  const res = await api.get<SalaryPayment[]>("/staff/salary-payments", {
    params: staffId ? { staffId } : undefined,
  });

  return res.data;
}
import { api } from "../axios";
import type {
  AttendanceStatus,
  PaySalaryPayload,
  SalaryPayment,
  Staff,
  StaffAttendance,
  StaffExpense,
  StaffExpensePayload,
  StaffExpenseSummary,
  StaffPayload,
} from "../../types/staff";

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

  if (error instanceof Error) return error.message;

  return "Request failed";
}

function toStaffFormData(payload: StaffPayload) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    if (key === "image" && value instanceof File) {
      formData.append("image", value);
      return;
    }

    formData.append(key, String(value));
  });

  return formData;
}

function unwrapStaffResponse(data: Staff | { user?: Staff }) {
  if (data && typeof data === "object" && "user" in data && data.user) {
    return data.user;
  }

  return data as Staff;
}

export function getStaffImageSrc(image?: string) {
  if (!image) return "/AddImage.png";
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  return image.startsWith("/") ? image : `/${image}`;
}

export async function getAllStaff(): Promise<Staff[]> {
  try {
    const res = await api.get<Staff[]>("/staff");
    return res.data;
  } catch (error) {
    throw new Error(getApiMessage(error));
  }
}

export async function getStaffById(staffId: string): Promise<Staff> {
  try {
    const res = await api.get<Staff>(`/staff/${staffId}`);
    return res.data;
  } catch (error) {
    throw new Error(getApiMessage(error));
  }
}

export async function createStaff(payload: StaffPayload): Promise<Staff> {
  try {
    const res = await api.post<Staff | { user: Staff }>(
      "/staff",
      toStaffFormData(payload)
    );

    return unwrapStaffResponse(res.data);
  } catch (error) {
    throw new Error(getApiMessage(error));
  }
}

export async function updateStaff(
  staffId: string,
  payload: StaffPayload
): Promise<Staff> {
  try {
    const res = await api.put<Staff | { user: Staff }>(
      `/staff/${staffId}`,
      toStaffFormData(payload)
    );

    return unwrapStaffResponse(res.data);
  } catch (error) {
    throw new Error(getApiMessage(error));
  }
}

export async function deleteStaff(staffId: string): Promise<Staff> {
  try {
    const res = await api.delete<Staff | { user: Staff }>(`/staff/${staffId}`);
    return unwrapStaffResponse(res.data);
  } catch (error) {
    throw new Error(getApiMessage(error));
  }
}

export async function getAttendanceByDate(
  date: string
): Promise<StaffAttendance[]> {
  try {
    const res = await api.get<StaffAttendance[]>("/staff/attendance", {
      params: { date },
    });

    return res.data;
  } catch (error) {
    throw new Error(getApiMessage(error));
  }
}

export async function updateStaffAttendance(payload: {
  staffId: string;
  date: string;
  status: AttendanceStatus;
  shiftStart?: string;
  shiftEnd?: string;
}): Promise<StaffAttendance> {
  try {
    const res = await api.put<StaffAttendance>("/staff/attendance", payload);
    return res.data;
  } catch (error) {
    throw new Error(getApiMessage(error));
  }
}

export async function payStaffSalary(
  staffId: string,
  payload: PaySalaryPayload
): Promise<SalaryPayment> {
  try {
    const res = await api.post<{
      message: string;
      expense?: SalaryPayment;
      payment?: SalaryPayment;
    }>(`/staff/${staffId}/pay-salary`, payload);

    return (res.data.expense || res.data.payment) as SalaryPayment;
  } catch (error) {
    throw new Error(getApiMessage(error));
  }
}

export async function createStaffExpense(
  staffId: string,
  payload: StaffExpensePayload
): Promise<StaffExpense> {
  try {
    const res = await api.post<{ message: string; expense: StaffExpense }>(
      `/staff/${staffId}/staff-expenses`,
      payload
    );

    return res.data.expense;
  } catch (error) {
    throw new Error(getApiMessage(error));
  }
}

export async function getStaffExpenses(query?: {
  staffId?: string;
  paymentMonth?: string;
  startDate?: string;
  endDate?: string;
  expenseType?: string;
  onlyExtra?: boolean;
}): Promise<StaffExpense[]> {
  try {
    const res = await api.get<StaffExpense[]>("/staff/staff-expenses", {
      params: query,
    });

    return res.data;
  } catch (error) {
    throw new Error(getApiMessage(error));
  }
}

/*
  Backward-compatible function.
  Existing salary report code can still call getSalaryPayments().
*/
export async function getSalaryPayments(
  staffId?: string
): Promise<SalaryPayment[]> {
  try {
    const res = await api.get<SalaryPayment[]>("/staff/salary-payments", {
      params: staffId ? { staffId } : undefined,
    });

    return res.data;
  } catch (error) {
    throw new Error(getApiMessage(error));
  }
}

export async function getStaffExpenseSummary(query?: {
  staffId?: string;
  paymentMonth?: string;
  startDate?: string;
  endDate?: string;
}): Promise<StaffExpenseSummary> {
  try {
    const res = await api.get<StaffExpenseSummary>(
      "/staff/staff-expense-summary",
      {
        params: query,
      }
    );

    return res.data;
  } catch (error) {
    throw new Error(getApiMessage(error));
  }
}

export async function deleteStaffExpense(expenseId: string) {
  try {
    const res = await api.delete<{ message: string; expense: StaffExpense }>(
      `/staff/staff-expenses/${expenseId}`
    );

    return res.data.expense;
  } catch (error) {
    throw new Error(getApiMessage(error));
  }
}
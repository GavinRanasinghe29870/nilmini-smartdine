export type StaffRole = "OWNER" | "MANAGER" | "CASHIER" | "WAITER" | "STAFF";

export type Staff = {
  id?: string;
  _id?: string;

  fullName: string;
  email?: string;
  username?: string;
  role: StaffRole;

  phone?: string;
  salary?: number;
  dob?: string;
  shiftStart?: string;
  shiftEnd?: string;
  address?: string;
  additionalDetails?: string;
};

export type AttendanceStatus = "Present" | "Absent" | "Half Shift" | "Leave";

export type StaffAttendance = {
  id?: string;
  _id?: string;
  staffId: string;
  fullName: string;
  role: StaffRole;
  date: string;
  shiftStart?: string;
  shiftEnd?: string;
  status?: AttendanceStatus | "";
  markedAt?: string | null;
  markedBy?: {
    id?: string;
    fullName?: string;
    role?: string;
  } | null;
};

export type PaySalaryPayload = {
  amount: number;
  paymentMonth: string;
  paidAt?: string;
  note?: string;
};

export type SalaryPayment = {
  _id: string;
  staffId: string;
  staffName: string;
  role: StaffRole;
  baseSalary: number;
  amount: number;
  currency: "LKR";
  paymentMonth: string;
  paidAt: string;
  note?: string;
};
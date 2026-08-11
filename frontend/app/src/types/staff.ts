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
  image?: string;

  createdAt?: string;
  updatedAt?: string;
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

export type StaffPayload = {
  fullName: string;
  email?: string;
  username?: string;
  password?: string;
  role: StaffRole;
  phone?: string;
  salary?: number;
  dob?: string;
  shiftStart?: string;
  shiftEnd?: string;
  address?: string;
  additionalDetails?: string;
  image?: string | File | null;
};

export type StaffExpenseType =
  | "Salary Payment"
  | "Salary Advance"
  | "Medical"
  | "Emergency"
  | "Transport"
  | "Food"
  | "Other";

export type StaffExpense = {
  id?: string;
  _id: string;
  staffId: string;
  staffName: string;
  role: StaffRole;
  baseSalary: number;
  amount: number;
  currency: "LKR";
  expenseType: StaffExpenseType;
  deductFromSalary: boolean;
  paymentMonth: string;
  paidAt: string;
  note?: string;
  createdBy?: {
    id?: string;
    fullName?: string;
    role?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
};

export type PaySalaryPayload = {
  amount: number;
  paymentMonth: string;
  paidAt?: string;
  note?: string;
};

export type StaffExpensePayload = {
  amount: number;
  expenseType: Exclude<StaffExpenseType, "Salary Payment">;
  deductFromSalary: boolean;
  paymentMonth: string;
  paidAt?: string;
  note?: string;
};


export type SalaryPayment = StaffExpense;

export type StaffExpenseSummary = {
  totalSalaryPayments: number;
  totalStaffExtraExpenses: number;
  totalStaffExpenses: number;
  totalDeductibleAdvances: number;
  breakdown: {
    expenseType: StaffExpenseType;
    totalAmount: number;
    count: number;
  }[];
};
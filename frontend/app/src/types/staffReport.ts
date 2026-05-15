export type StaffReportRow = {
  id: string;
  staffId: string;
  fullName: string;
  email?: string;
  role: string;
  phone?: string;

  registeredSalary: number;

  totalPaid: number;
  totalPayment: number;
  paymentStatus: "Paid" | "No Payment";

  remainingSalary: number;

  presentDays: number;
  absentDays: number;
  halfShiftDays: number;
  leaveDays: number;
  markedDays: number;
  workedDayUnits: number;
  attendanceRate: number;

  paymentCount: number;
  lastPaymentDate: string;
  lastAttendanceDate: string;
};

export type StaffReportSummary = {
  totalStaff: number;

  totalIncome: number;
  totalStaffExpenses: number;
  netAfterStaffExpenses: number;
  staffExpenseRate: number;

  totalRegisteredSalary: number;
  totalSalaryPaid: number;
  totalRemainingSalary: number;

  totalPresentDays: number;
  totalAbsentDays: number;
  totalHalfShiftDays: number;
  totalLeaveDays: number;
  totalMarkedDays: number;
  totalWorkedDayUnits: number;

  averageAttendanceRate: number;
  staffWithPayments: number;
  unpaidStaff: number;
};

export type StaffReportFilters = {
  startDate: string;
  endDate: string;
  search: string;
  sortBy: string;
  sortOrder: string;
  role: string;
};

export type StaffReportResponse = {
  success: boolean;
  message?: string;
  filters: StaffReportFilters;
  summary: StaffReportSummary;
  warnings?: string[];
  data: StaffReportRow[];
};
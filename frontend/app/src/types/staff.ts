export type StaffRole = "OWNER" | "MANAGER" | "CASHIER" | "WAITER" | "STAFF";

export type Staff = {
  _id?: string;

  fullName: string;
  email?: string;
  username?: string;
  role: StaffRole;

  phone?: string;
  salary?: number;
  dob?: string; // YYYY-MM-DD
  shiftStart?: string; // HH:mm
  shiftEnd?: string;   // HH:mm
  address?: string;
  additionalDetails?: string;
};

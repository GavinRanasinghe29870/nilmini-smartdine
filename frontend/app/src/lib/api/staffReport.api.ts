import { api } from "../axios";
import type { StaffReportResponse } from "../../types/staffReport";

export type StaffReportQuery = {
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  role?: string;
};

export async function getStaffReport(
  query: StaffReportQuery
): Promise<StaffReportResponse> {
  const res = await api.get<StaffReportResponse>("/reports/staff", {
    params: {
      startDate: query.startDate,
      endDate: query.endDate,
      search: query.search || "",
      sortBy: query.sortBy || "fullName",
      sortOrder: query.sortOrder || "asc",
      role: query.role || "",
    },
  });

  return res.data;
}
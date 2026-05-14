import { api } from "../axios";
import type { SalesReportResponse } from "../../types/salesReport";

export type SalesReportQuery = {
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  ageGroup?: string;
  weather?: string;
  holiday?: string;
};

export async function getSalesReport(
  query: SalesReportQuery
): Promise<SalesReportResponse> {
  const res = await api.get<SalesReportResponse>("/reports/sales", {
    params: {
      startDate: query.startDate,
      endDate: query.endDate,
      search: query.search || "",
      sortBy: query.sortBy || "date",
      sortOrder: query.sortOrder || "desc",
      ageGroup: query.ageGroup || "",
      weather: query.weather || "",
      holiday: query.holiday || "",
    },
  });

  return res.data;
}
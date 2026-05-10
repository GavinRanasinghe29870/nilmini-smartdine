import { api } from "../axios";
import type { RevenueReportResponse } from "../../types/report";

export type RevenueReportQuery = {
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export async function getRevenueReport(
  query: RevenueReportQuery
): Promise<RevenueReportResponse> {
  const res = await api.get<RevenueReportResponse>("/reports/revenue", {
    params: {
      startDate: query.startDate,
      endDate: query.endDate,
      search: query.search || "",
      sortBy: query.sortBy || "date",
      sortOrder: query.sortOrder || "desc",
    },
  });

  return res.data;
}
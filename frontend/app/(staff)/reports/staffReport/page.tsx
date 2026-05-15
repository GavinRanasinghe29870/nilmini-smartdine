"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";
import DataTable, { Column } from "../../../src/components/DataTable";
import { useRouter, usePathname } from "next/navigation";
import { getStaffReport } from "../../../src/lib/api/staffReport.api";
import type {
  StaffReportResponse,
  StaffReportRow,
} from "../../../src/types/staffReport";

/* Types */
type StaffReport = {
  staffId: string;
  staffName: string;
  role: string;
  period: string;
  attendance: string;
  absentLeave: string;
  expenses: string;
  totalPayment: string;
};

const reportTabs = [
  { label: "Revenue Report", path: "/reports/revenueReport" },
  { label: "Staff Report", path: "/reports/staffReport" },
  { label: "Sales Report", path: "/reports/salesReport" },
];

function getColomboDateString(offsetDays = 0) {
  const now = new Date();
  const targetDate = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(targetDate);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function getCurrentMonthStart() {
  const today = getColomboDateString(0);
  const [year, month] = today.split("-");
  return `${year}-${month}-01`;
}

function formatCurrency(value: number) {
  return `LKR ${Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateForDisplay(date: string) {
  if (!date) return "-";

  const parts = date.split("-");
  if (parts.length !== 3) return date;

  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

function formatPeriod(startDate: string, endDate: string) {
  return `${formatDateForDisplay(startDate)} - ${formatDateForDisplay(endDate)}`;
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

/* Table Columns */
const columns: Column<StaffReport>[] = [
  { key: "staffId", label: "Staff ID" },
  { key: "staffName", label: "Staff Name" },
  { key: "role", label: "Role", align: "center" },
  { key: "period", label: "Report Period", align: "center" },
  { key: "attendance", label: "Attendance", align: "center" },
  { key: "absentLeave", label: "Absent / Leave", align: "center" },
  { key: "expenses", label: "Staff expenses", align: "right" },
  { key: "totalPayment", label: "Total Payment", align: "right" },
];

/* PAGE */
export default function ReportsPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipText, setTooltipText] = useState("");

  const [startDate] = useState(getCurrentMonthStart());
  const [endDate] = useState(getColomboDateString(0));

  const [report, setReport] = useState<StaffReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadReport() {
    try {
      setLoading(true);
      setError("");

      const result = await getStaffReport({
        startDate,
        endDate,
        sortBy: "fullName",
        sortOrder: "asc",
      });

      setReport(result);
    } catch (err) {
      setReport(null);
      setError(err instanceof Error ? err.message : "Failed to load staff report");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = report?.summary;

  const totalStaff = summary?.totalStaff || 0;
  const totalIncome = Number(summary?.totalIncome || 0);
  const staffExpenses = Number(
    summary?.totalStaffExpenses ?? summary?.totalSalaryPaid ?? 0
  );

  const netIncomeAfterStaff = Math.max(totalIncome - staffExpenses, 0);

  const staffPaymentPercentage =
    totalIncome > 0 ? clampPercent((staffExpenses / totalIncome) * 100) : 0;

  const incomePercentage =
    totalIncome > 0 ? clampPercent((netIncomeAfterStaff / totalIncome) * 100) : 0;

  const tableData: StaffReport[] = useMemo(() => {
    const rows: StaffReportRow[] = report?.data || [];

    return rows.map((row) => ({
      staffId: row.staffId ? `#${row.staffId.slice(-6)}` : "-",
      staffName: row.fullName || "-",
      role: row.role || "-",
      period: formatPeriod(startDate, endDate),
      attendance: `Present ${row.presentDays} / Half ${row.halfShiftDays}`,
      absentLeave: `Absent ${row.absentDays} / Leave ${row.leaveDays}`,
      expenses: formatCurrency(row.totalPaid || 0),
      totalPayment:
        row.paymentCount > 0
          ? formatCurrency(row.totalPayment || row.totalPaid || 0)
          : "No Payment",
    }));
  }, [report, startDate, endDate]);

  /* Donut values */
  const radius = 80;
  const stroke = 25;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;

  const incomeDashoffset =
    circumference - (incomePercentage / 100) * circumference;

  const staffPaymentDashoffset =
    circumference - (staffPaymentPercentage / 100) * circumference;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="items-center justify-between">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full bg-bg-2 hover:bg-bg-1"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-h4 font-semibold">Staff Report</h1>
        </div>

        <div className="flex items-center justify-between">
          {/* Tabs */}
          <div className="flex gap-3">
            {reportTabs.map((tab) => {
              const isActive = pathname === tab.path;

              return (
                <button
                  key={tab.path}
                  onClick={() => router.push(tab.path)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition
                    ${
                      isActive
                        ? "bg-primary text-black"
                        : "bg-bg-2 text-gray-400 hover:bg-bg-1"
                    }
                  `}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-2 text-paragraph">
              <Calendar size={16} />
              <span>{formatPeriod(startDate, endDate)}</span>
            </div>

            <button
              onClick={loadReport}
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-primary text-text-black text-paragraph font-medium whitespace-nowrap flex items-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {report?.warnings && report.warnings.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 px-4 py-3 rounded-xl text-sm">
          {report.warnings.join(" | ")}
        </div>
      )}

      {/* Chart Card */}
      <div className="bg-bg-2 rounded-2xl p-6 w-[420px]">
        <h2 className="text-h6 text-gray-300 mb-4">
          Total Staff - {loading ? "..." : totalStaff}
        </h2>

        <div className="flex items-center gap-6">
          {/* Donut Chart */}
          <div className="relative">
            {/* Tooltip */}
            {showTooltip && (
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-bg-1 text-white text-xs px-3 py-1 rounded-md shadow-lg whitespace-nowrap">
                {tooltipText}
              </div>
            )}

            <svg width={160} height={160}>
              {/* Background circle */}
              <circle
                stroke="#1f1f1f"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={80}
                cy={80}
              />

              {/* Income segment */}
              <circle
                stroke="var(--bg-1)"
                fill="transparent"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={incomeDashoffset}
                r={normalizedRadius}
                cx={80}
                cy={80}
                transform="rotate(-90 80 80)"
                style={{ pointerEvents: "stroke" }}
                onMouseEnter={() => {
                  setShowTooltip(true);
                  setTooltipText(
                    `Income after staff payments – ${incomePercentage.toFixed(
                      1
                    )}%`
                  );
                }}
                onMouseLeave={() => setShowTooltip(false)}
              />

              {/* Staff payments segment */}
              <circle
                stroke="var(--primary)"
                fill="transparent"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={staffPaymentDashoffset}
                r={normalizedRadius}
                cx={80}
                cy={80}
                transform={`rotate(${-90 + incomePercentage * 3.6} 80 80)`}
                style={{ pointerEvents: "stroke" }}
                onMouseEnter={() => {
                  setShowTooltip(true);
                  setTooltipText(
                    `Staff payments – ${staffPaymentPercentage.toFixed(1)}%`
                  );
                }}
                onMouseLeave={() => setShowTooltip(false)}
              />
            </svg>
          </div>

          {/* Legend */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-bg-1" />
              <span>Income</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary" />
              <span>Staff payments</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={tableData} />
    </div>
  );
}
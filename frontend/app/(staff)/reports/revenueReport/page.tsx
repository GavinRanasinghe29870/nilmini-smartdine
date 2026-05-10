"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ArrowLeft, Calendar, Loader2, Search } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

import DataTable, { Column } from "../../../src/components/DataTable";
import { getRevenueReport } from "../../../src/lib/api/report.api";
import type {
  RevenueReportResponse,
  RevenueReportRow,
} from "../../../src/types/report";

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

function formatCurrency(value: number) {
  return `LKR ${Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatNullableCurrency(value?: number) {
  if (value === undefined || value === null) return "-";
  return formatCurrency(value);
}

function formatDateRange(startDate: string, endDate: string) {
  return `${startDate} – ${endDate}`;
}

export default function RevenueReportPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [startDate, setStartDate] = useState(getColomboDateString(-7));
  const [endDate, setEndDate] = useState(getColomboDateString(0));
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [report, setReport] = useState<RevenueReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getRevenueReport({
        startDate,
        endDate,
        search,
        sortBy,
        sortOrder,
      });

      setReport(result);
    } catch (err) {
      setReport(null);
      setError(
        err instanceof Error ? err.message : "Failed to load revenue report"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pieData = useMemo(() => {
    return report?.charts?.pieData || [];
  }, [report]);

  const lineData = useMemo(() => {
    return report?.charts?.lineData || [];
  }, [report]);

  const tableData = useMemo(() => {
    return report?.data || [];
  }, [report]);

  const hasPieData = pieData.some((item) => Number(item.value || 0) > 0);
  const hasLineData = lineData.length > 0;

  const columns: Column<RevenueReportRow>[] = [
    {
      key: "productName",
      label: "Product Item",
      render: (row) => (
        <div>
          <p className="font-medium text-text-white">{row.productName}</p>

          {row.itemId && (
            <p className="text-xs text-gray-400 mt-1">{row.itemId}</p>
          )}

          {row.categoryName && (
            <p className="text-xs text-gray-500 mt-1">{row.categoryName}</p>
          )}

          {row.expenseStatus === "no_ingredients" && (
            <p className="text-xs text-gray-500 mt-1">No ingredients</p>
          )}

          {row.expenseStatus === "missing_inventory" && (
            <p className="text-xs text-red-400 mt-1">
              Missing inventory item
            </p>
          )}
        </div>
      ),
    },
    {
      key: "date",
      label: "Date",
      align: "center",
    },
    {
      key: "totalQuantity",
      label: "Sold Qty",
      align: "center",
      render: (row) => `${row.totalQuantity} items`,
    },
    {
      key: "averageUnitPrice",
      label: "Unit Price",
      align: "right",
      render: (row) => formatCurrency(row.averageUnitPrice),
    },
    {
      key: "revenue",
      label: "Revenue",
      align: "right",
      render: (row) => formatCurrency(row.revenue),
    },
    {
      key: "ingredientCost",
      label: "Ingredient Cost",
      align: "right",
      render: (row) => formatCurrency(row.ingredientCost),
    },
    {
      key: "profit",
      label: "Profit",
      align: "right",
      render: (row) => (
        <span
          className={
            row.profit >= 0
              ? "text-primary font-medium"
              : "text-red-400 font-medium"
          }
        >
          {formatCurrency(row.profit)}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 bg-bg-1 min-h-screen">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full bg-bg-2 hover:bg-bg-1"
          >
            <ArrowLeft size={18} />
          </button>

          <h1 className="text-h4 font-semibold">Revenue Report</h1>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            {reportTabs.map((tab) => {
              const isActive = pathname === tab.path;

              return (
                <button
                  key={tab.path}
                  onClick={() => router.push(tab.path)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-primary text-text-black"
                      : "bg-bg-2 text-gray-400 hover:bg-bg-1"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-2 text-paragraph">
              <Calendar size={16} />
              <span>{formatDateRange(startDate, endDate)}</span>
            </div>

            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="px-3 py-2 rounded-xl bg-bg-2 text-text-white outline-none"
            />

            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="px-3 py-2 rounded-xl bg-bg-2 text-text-white outline-none"
            />

            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-2">
              <Search size={16} className="text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search product..."
                className="bg-transparent outline-none text-sm text-text-white placeholder:text-gray-500 w-40"
              />
            </div>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="px-3 py-2 rounded-xl bg-bg-2 text-text-white outline-none"
            >
              <option value="date">Sort by Date</option>
              <option value="productName">Sort by Product</option>
              <option value="revenue">Sort by Revenue</option>
              <option value="ingredientCost">Sort by Ingredient Cost</option>
              <option value="profit">Sort by Profit</option>
              <option value="totalQuantity">Sort by Quantity</option>
            </select>

            <select
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(event.target.value as "asc" | "desc")
              }
              className="px-3 py-2 rounded-xl bg-bg-2 text-text-white outline-none"
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>

            <button
              onClick={loadReport}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-text-black text-paragraph font-medium whitespace-nowrap disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {report?.warnings && report.warnings.length > 0 && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
          {report.warnings[0]}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-bg-2 rounded-2xl p-5">
          <p className="text-sm text-gray-400">Total Revenue</p>
          <p className="text-h5 font-semibold mt-2">
            {loading
              ? "Loading..."
              : formatNullableCurrency(report?.summary?.totalRevenue)}
          </p>
        </div>

        <div className="bg-bg-2 rounded-2xl p-5">
          <p className="text-sm text-gray-400">Ingredient Cost</p>
          <p className="text-h5 font-semibold mt-2">
            {loading
              ? "Loading..."
              : formatNullableCurrency(report?.summary?.totalIngredientCost)}
          </p>
        </div>

        <div className="bg-bg-2 rounded-2xl p-5">
          <p className="text-sm text-gray-400">Total Profit</p>
          <p className="text-h5 font-semibold mt-2 text-primary">
            {loading
              ? "Loading..."
              : formatNullableCurrency(report?.summary?.totalProfit)}
          </p>
        </div>

        <div className="bg-bg-2 rounded-2xl p-5">
          <p className="text-sm text-gray-400">Sold Quantity</p>
          <p className="text-h5 font-semibold mt-2">
            {loading
              ? "Loading..."
              : report?.summary?.totalQuantity !== undefined
              ? `${report.summary.totalQuantity} items`
              : "-"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-2 rounded-2xl p-6 min-w-0">
          <h2 className="text-h6 text-gray-400 mb-4">
            Revenue vs Ingredient Cost
          </h2>

          <div className="relative flex justify-center items-center h-[260px] w-full min-w-0">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                <Loader2 size={18} className="animate-spin mr-2" />
                Loading chart...
              </div>
            ) : hasPieData ? (
              <>
                <PieChart width={260} height={260}>
                  <Pie
                    data={pieData}
                    innerRadius={85}
                    outerRadius={110}
                    dataKey="value"
                  >
                    <Cell fill="var(--primary)" />
                    <Cell fill="var(--button)" />
                  </Pie>
                </PieChart>

                <div className="absolute text-center">
                  <p className="text-h6 text-gray-400">Profit</p>
                  <p className="text-h5 font-semibold">
                    {formatNullableCurrency(report?.summary?.totalProfit)}
                  </p>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                No revenue chart data available.
              </div>
            )}
          </div>

          <div className="flex justify-center gap-6 mt-4 text-paragraph">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary" />
              Revenue
            </span>

            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-button" />
              Ingredient Cost
            </span>
          </div>
        </div>

        <div className="bg-bg-2 rounded-2xl p-6 min-w-0">
          <h2 className="text-h6 text-gray-400 mb-4">Daily Revenue</h2>

          <div className="h-[260px] w-full min-w-0">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                <Loader2 size={18} className="animate-spin mr-2" />
                Loading chart...
              </div>
            ) : hasLineData ? (
              <ResponsiveContainer width="100%" height={260} minWidth={1}>
                <LineChart data={lineData}>
                  <XAxis
                    dataKey="date"
                    stroke="var(--text-white)"
                    tick={{ fontSize: 12 }}
                  />

                  <YAxis stroke="var(--text-white)" tick={{ fontSize: 12 }} />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-1)",
                      borderRadius: "12px",
                      border: "none",
                      color: "var(--text-white)",
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={false}
                  />

                  <Line
                    type="monotone"
                    dataKey="ingredientCost"
                    stroke="var(--button)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                No daily revenue data available.
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" />
          Loading revenue report...
        </div>
      ) : tableData.length > 0 ? (
        <DataTable columns={columns} data={tableData} />
      ) : (
        <div className="rounded-2xl bg-bg-2 p-8 text-center text-gray-400">
          No revenue records found for the selected date range.
        </div>
      )}
    </div>
  );
}
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ArrowLeft, Loader2, Search, Eye, X } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import DataTable, { Column } from "../../../src/components/DataTable";
import { useRouter, usePathname } from "next/navigation";
import { getSalesReport } from "../../../src/lib/api/salesReport.api";
import type {
  SalesReportResponse,
  SalesReportRow,
} from "../../../src/types/salesReport";

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

function formatDateRange(startDate: string, endDate: string) {
  return `${startDate} – ${endDate}`;
}

type DatePickerFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function openNativePicker(input: HTMLInputElement | null) {
  if (!input) return;

  input.focus();

  const pickerInput = input as HTMLInputElement & {
    showPicker?: () => void;
  };

  if (typeof pickerInput.showPicker === "function") {
    try {
      pickerInput.showPicker();
    } catch {
      // Browser may block showPicker outside direct user action.
      // Focus still keeps the native input usable.
    }
  }
}

function DatePickerField({ label, value, onChange }: DatePickerFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => openNativePicker(inputRef.current)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openNativePicker(inputRef.current);
        }
      }}
      className="flex items-center gap-2 bg-bg-1 border border-white/10 rounded-lg px-4 py-2 text-white cursor-pointer"
    >
      <Calendar size={18} className="text-primary shrink-0" />

      <div className="flex flex-col">
        <span className="text-[11px] leading-none text-gray-400">
          {label}
        </span>

        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onClick={(event) => {
            event.stopPropagation();
            openNativePicker(event.currentTarget);
          }}
          className="bg-transparent text-sm text-white outline-none cursor-pointer [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer"
        />
      </div>
    </div>
  );
}

export default function SalesReportPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [startDate, setStartDate] = useState(getColomboDateString(-7));
  const [endDate, setEndDate] = useState(getColomboDateString(0));
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [ageGroup, setAgeGroup] = useState("");
  const [weather, setWeather] = useState("");
  const [holiday, setHoliday] = useState("");

  const [report, setReport] = useState<SalesReportResponse | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<SalesReportRow | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getSalesReport({
        startDate,
        endDate,
        search,
        sortBy,
        sortOrder,
        ageGroup,
        weather,
        holiday,
      });

      setReport(result);
    } catch (err) {
      setReport(null);
      setError(
        err instanceof Error ? err.message : "Failed to load sales report"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chartData = useMemo(() => {
    return report?.charts?.lineData || [];
  }, [report]);

  const tableData = useMemo(() => {
    return report?.data || [];
  }, [report]);

  const filterOptions = report?.filterOptions;

  const itemColumns: Column<SalesReportRow>[] = [
    {
      key: "orderNumber",
      label: "Order ID",
      render: (row) => row.orderNumber || "-",
    },
    {
      key: "productSummary",
      label: "Product Items",
      render: (row) => (
        <div>
          <p className="font-medium text-text-white">{row.productSummary}</p>
          <p className="text-xs text-gray-400 mt-1">
            {row.itemCount} item types • {row.totalUnits} units
          </p>
        </div>
      ),
    },
    { key: "date", label: "Date", align: "center" },
    { key: "time", label: "Time", align: "center" },
    {
      key: "ageGroupWithSize",
      label: "Customer Age Group & Size",
      render: (row) => row.ageGroupWithSize,
    },
    { key: "weather", label: "Weather Type", align: "center" },
    { key: "holiday", label: "Holiday", align: "center" },
    {
      key: "totalRevenue",
      label: "Revenue",
      align: "right",
      render: (row) => formatCurrency(row.totalRevenue),
    },
    {
      key: "actions",
      label: "",
      align: "center",
      render: (row) => (
        <button
          onClick={() => setSelectedOrder(row)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-text-black text-sm font-medium"
        >
          <Eye size={15} />
          View
        </button>
      ),
    },
  ];

  return (
    <main className="flex-1 p-8 space-y-6 bg-bg-1 min-h-screen text-white">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full bg-bg-2 hover:bg-bg-1"
          type="button"
        >
          <ArrowLeft size={18} />
        </button>

        <div>
          <h1 className="text-h4 font-semibold">Sales Report</h1>
          <p className="text-sm text-gray-400">
            View order sales, sold products, customer groups, and daily sales
            trends.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        {reportTabs.map((tab) => {
          const isActive = pathname === tab.path;

          return (
            <button
              key={tab.path}
              onClick={() => router.push(tab.path)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                isActive
                  ? "bg-primary text-black"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              type="button"
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="bg-bg-2 rounded-xl p-4 mb-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 border border-white/10">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Sales Report Filters
          </h2>
          <p className="text-sm text-gray-400">
            Selected period: {formatDateRange(startDate, endDate)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DatePickerField
            label="Start Date"
            value={startDate}
            onChange={setStartDate}
          />

          <DatePickerField
            label="End Date"
            value={endDate}
            onChange={setEndDate}
          />

          <div className="flex items-center gap-2 bg-bg-1 border border-white/10 rounded-lg px-4 py-2">
            <Search size={16} className="text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search product/order..."
              className="bg-transparent outline-none text-sm text-white placeholder:text-gray-500 w-48"
            />
          </div>

          <select
            value={ageGroup}
            onChange={(event) => setAgeGroup(event.target.value)}
            className="bg-bg-1 border border-white/10 rounded-lg px-4 py-2 text-white outline-none"
          >
            <option value="">All Age Groups</option>
            {(filterOptions?.ageGroups || []).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={weather}
            onChange={(event) => setWeather(event.target.value)}
            className="bg-bg-1 border border-white/10 rounded-lg px-4 py-2 text-white outline-none"
          >
            <option value="">All Weather</option>
            {(filterOptions?.weatherTypes || []).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={holiday}
            onChange={(event) => setHoliday(event.target.value)}
            className="bg-bg-1 border border-white/10 rounded-lg px-4 py-2 text-white outline-none"
          >
            <option value="">All Holiday Types</option>
            {(filterOptions?.holidayTypes || []).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="bg-bg-1 border border-white/10 rounded-lg px-4 py-2 text-white outline-none"
          >
            <option value="date">Sort by Date</option>
            <option value="orderNumber">Sort by Order ID</option>
            <option value="totalUnits">Sort by Unit Sold</option>
            <option value="totalRevenue">Sort by Revenue</option>
            <option value="ageGroup">Sort by Age Group</option>
            <option value="weather">Sort by Weather</option>
          </select>

          <select
            value={sortOrder}
            onChange={(event) =>
              setSortOrder(event.target.value as "asc" | "desc")
            }
            className="bg-bg-1 border border-white/10 rounded-lg px-4 py-2 text-white outline-none"
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>

          <button
            onClick={loadReport}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-lg font-medium whitespace-nowrap disabled:opacity-60"
            type="button"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Generate Report
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-bg-2 rounded-2xl p-5">
          <p className="text-sm text-gray-400">Total Orders</p>
          <p className="text-h5 font-semibold mt-2">
            {loading ? "Loading..." : report?.summary?.totalOrders ?? "-"}
          </p>
        </div>

        <div className="bg-bg-2 rounded-2xl p-5">
          <p className="text-sm text-gray-400">Total Units Sold</p>
          <p className="text-h5 font-semibold mt-2">
            {loading ? "Loading..." : report?.summary?.totalUnitSold ?? "-"}
          </p>
        </div>

        <div className="bg-bg-2 rounded-2xl p-5">
          <p className="text-sm text-gray-400">Sales Revenue</p>
          <p className="text-h5 font-semibold mt-2 text-primary">
            {loading
              ? "Loading..."
              : formatCurrency(report?.summary?.totalSalesRevenue || 0)}
          </p>
        </div>

        <div className="bg-bg-2 rounded-2xl p-5">
          <p className="text-sm text-gray-400">Best Selling Product</p>
          <p className="text-h5 font-semibold mt-2">
            {loading
              ? "Loading..."
              : report?.summary?.bestSellingProduct || "-"}
          </p>
          {!loading && report?.summary?.bestSellingProduct && (
            <p className="text-xs text-gray-400 mt-1">
              {report.summary.bestSellingUnits} items
            </p>
          )}
        </div>
      </div>

      <div className="inline-block bg-bg-2 rounded-2xl p-5 min-w-0">
        <div className="inline-block bg-primary px-4 py-1 rounded-md text-sm text-text-black mb-4">
          Total Sales
        </div>

        <div className="h-56 w-[600px] max-w-full min-w-0">
          {loading ? (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              <Loader2 size={18} className="animate-spin mr-2" />
              Loading chart...
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={224} minWidth={1}>
              <LineChart data={chartData}>
                <XAxis
                  dataKey="date"
                  stroke="var(--text-white)"
                  tick={{ fontSize: 12 }}
                />
                <YAxis stroke="var(--text-white)" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--bg-1)",
                    borderRadius: "8px",
                    border: "none",
                    color: "var(--text-white)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
              No sales chart data available.
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" />
          Loading sales report...
        </div>
      ) : tableData.length > 0 ? (
        <DataTable columns={itemColumns} data={tableData} />
      ) : (
        <div className="rounded-2xl bg-bg-2 p-8 text-center text-gray-400">
          No sales records found for the selected date range.
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-bg-2 border border-white/10 shadow-xl overflow-hidden">
            <div className="flex items-start justify-between p-5 border-b border-white/10">
              <div>
                <h2 className="text-h5 font-semibold">Order Product Items</h2>
                <p className="text-sm text-gray-400 mt-1">
                  {selectedOrder.orderNumber || "Order"} • {selectedOrder.date}{" "}
                  {selectedOrder.time}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-lg hover:bg-bg-1 text-gray-400 hover:text-text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl bg-bg-1 p-4">
                  <p className="text-xs text-gray-400">Customer Group</p>
                  <p className="font-medium mt-1">
                    {selectedOrder.ageGroupWithSize}
                  </p>
                </div>

                <div className="rounded-xl bg-bg-1 p-4">
                  <p className="text-xs text-gray-400">Weather / Holiday</p>
                  <p className="font-medium mt-1">
                    {selectedOrder.weather} / {selectedOrder.holiday}
                  </p>
                </div>

                <div className="rounded-xl bg-bg-1 p-4">
                  <p className="text-xs text-gray-400">Order Revenue</p>
                  <p className="font-medium mt-1 text-primary">
                    {formatCurrency(selectedOrder.totalRevenue)}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-sm">
                  <thead className="bg-bg-1 text-gray-400">
                    <tr>
                      <th className="text-left p-3">Product</th>
                      <th className="text-left p-3">Category</th>
                      <th className="text-center p-3">Qty</th>
                      <th className="text-right p-3">Unit Price</th>
                      <th className="text-right p-3">Line Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedOrder.items.map((item, index) => (
                      <tr
                        key={`${item.productId}-${item.productName}-${index}`}
                        className="border-t border-white/10"
                      >
                        <td className="p-3 font-medium">{item.productName}</td>
                        <td className="p-3 text-gray-400">
                          {item.categoryName || "-"}
                        </td>
                        <td className="p-3 text-center">{item.quantity}</td>
                        <td className="p-3 text-right">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="p-3 text-right text-primary">
                          {formatCurrency(item.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl bg-bg-1 p-4">
                  <p className="text-xs text-gray-400">Order Status</p>
                  <p className="font-medium mt-1">
                    {selectedOrder.orderStatus || "-"}
                  </p>
                </div>

                <div className="rounded-xl bg-bg-1 p-4">
                  <p className="text-xs text-gray-400">Payment Status</p>
                  <p className="font-medium mt-1">
                    {selectedOrder.paymentStatus || "-"}
                  </p>
                </div>

                <div className="rounded-xl bg-bg-1 p-4">
                  <p className="text-xs text-gray-400">Payment Method</p>
                  <p className="font-medium mt-1">
                    {selectedOrder.paymentMethod || "-"}
                  </p>
                </div>
              </div>

              {selectedOrder.note && (
                <div className="rounded-xl bg-bg-1 p-4">
                  <p className="text-xs text-gray-400">Note</p>
                  <p className="font-medium mt-1">{selectedOrder.note}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
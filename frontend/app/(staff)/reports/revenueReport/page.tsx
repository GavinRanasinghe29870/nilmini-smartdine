"use client";

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
import { Calendar } from "lucide-react";
import DataTable, { Column } from "../../../src/components/DataTable";
import { ArrowLeft } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

/* Types */
type ReportRow = {
  id: number;
  product: string;
  date: string;
  sellIncome: string;
  expenses: string;
  profit: string;
  total: string;
};

const reportTabs = [
  { label: "Revenue Report", path: "/reports/revenueReport" },
  { label: "Staff Report", path: "/reports/staffReport" },
  { label: "Sales Report", path: "/reports/salesReport" },
];

/* Chart Data */
const pieData = [
  { name: "Income", value: 60 },
  { name: "Expenses", value: 40 },
];

const lineData = [
  { month: "JAN", revenue: 2400 },
  { month: "FEB", revenue: 1800 },
  { month: "MAR", revenue: 2100 },
  { month: "APR", revenue: 3200 },
  { month: "MAY", revenue: 2800 },
  { month: "JUN", revenue: 3600 },
  { month: "JUL", revenue: 3000 },
  { month: "AUG", revenue: 4200 },
  { month: "SEP", revenue: 2600 },
  { month: "OCT", revenue: 3100 },
  { month: "NOV", revenue: 2900 },
  { month: "DEC", revenue: 4500 },
];

/* Table */
const tableData: ReportRow[] = Array.from({ length: 6 }).map((_, i) => ({
  id: i + 1,
  product: "Chicken Permeson",
  date: "28.03.2024",
  sellIncome: "$55.00",
  expenses: "$15.00",
  profit: "$7,985.00",
  total: "$8000.00",
}));

const columns: Column<ReportRow>[] = [
  { key: "id", label: "S.No" },
  { key: "product", label: "Product Item" },
  { key: "date", label: "Revenue By Date" },
  { key: "sellIncome", label: "Sell Income", align: "right" },
  { key: "expenses", label: "Product expenses", align: "right" },
  { key: "profit", label: "Profit", align: "right" },
  { key: "total", label: "Total Revenue", align: "right" },
];

/* PAGE */
export default function ReportsPage() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="p-6 space-y-6 bg-bg-1 min-h-screen">
      {/* Header */}
      <div className="items-center justify-between">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full bg-bg-2 hover:bg-bg-1"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-h4 font-semibold">Revenue Report</h1>
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
            ${isActive
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
              <span>01/04/2024 – 08/04/2024</span>
            </div>

            <button className="px-5 py-2 rounded-xl bg-primary text-text-black text-paragraph font-medium whitespace-nowrap">
              Generate Report
            </button>
          </div>
        </div>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-bg-2 rounded-2xl p-6">
          <h2 className="text-h6 text-gray-400 mb-4">Total Revenue</h2>

          <div className="relative flex justify-center items-center h-[260px]">
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
              <p className="text-h6 text-gray-400">Total</p>
              <p className="text-h5 font-semibold">1556$</p>
            </div>
          </div>

          <div className="flex justify-center gap-6 mt-4 text-paragraph">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary" />
              Income
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-button" />
              Expenses
            </span>
          </div>
        </div>

        {/* Line Chart */}
        <div className="bg-bg-2 rounded-2xl p-6">
          <h2 className="text-h6 text-gray-400 mb-4">Total Revenue</h2>

          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <XAxis
                  dataKey="month"
                  stroke="var(--text-white)"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  stroke="var(--text-white)"
                  tick={{ fontSize: 12 }}
                />
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
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={tableData} />
    </div>
  );
}

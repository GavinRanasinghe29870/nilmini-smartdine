"use client";

import { Calendar, ArrowLeft } from "lucide-react";
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

type SalesRow = {
  id: string;
  productName: string;
  date: string;
  time: string;
  unitSold: string;
  ageGroup: string;
  weather: string;
  holiday: string;
};

const reportTabs = [
  { label: "Revenue Report", path: "/reports/revenueReport" },
  { label: "Staff Report", path: "/reports/staffReport" },
  { label: "Sales Report", path: "/reports/salesReport" },
];

const chartData = [
  { month: "JAN", sales: 2800 },
  { month: "FEB", sales: 3400 },
  { month: "MAR", sales: 2600 },
  { month: "APR", sales: 3800 },
  { month: "MAY", sales: 4200 },
  { month: "JUN", sales: 3600 },
  { month: "JUL", sales: 4100 },
  { month: "AUG", sales: 3900 },
  { month: "SEP", sales: 3300 },
  { month: "OCT", sales: 3000 },
  { month: "NOV", sales: 2700 },
  { month: "DEC", sales: 4500 },
];

const tableData: SalesRow[] = Array.from({ length: 6 }).map(() => ({
  id: "01",
  productName: "Chicken Permeson",
  date: "28.03.2024",
  time: "6:30",
  unitSold: "19 : 30",
  ageGroup: "Young Adults - 2",
  weather: "Sunny",
  holiday: "No",
}));

const columns: Column<SalesRow>[] = [
  { key: "id", label: "ID" },
  { key: "productName", label: "Product Name" },
  { key: "date", label: "Date" },
  { key: "time", label: "Time" },
  { key: "unitSold", label: "Unit Sold" },
  { key: "ageGroup", label: "Customer Age Group & Size" },
  { key: "weather", label: "Weather Type", align: "right" },
  { key: "holiday", label: "Holiday", align: "right" },
];

export default function ReportsPage() {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="items-center justify-between">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full bg-bg-2 hover:bg-bg-1"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-h4 font-semibold">Sales Report</h1>
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

      {/* Chart Card */}
      <div className="inline-block bg-bg-2 rounded-2xl p-5">
        <div className="inline-block bg-primary px-4 py-1 rounded-md text-sm text-black mb-4">
          Total Sales
        </div>

        <div className="h-56 w-[600px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111315",
                  borderRadius: "8px",
                  border: "none",
                  color: "#fff",
                }}
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#A78BFA"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Table */}
      <DataTable columns={columns} data={tableData} />
    </div>
  );
}

"use client";

import {
  Bell,
  User,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* -------------------- Mock Chart Data -------------------- */
const chartData = [
  { month: "JAN", sales: 2200, revenue: 1800 },
  { month: "FEB", sales: 2600, revenue: 2100 },
  { month: "MAR", sales: 2000, revenue: 2300 },
  { month: "APR", sales: 2800, revenue: 1900 },
  { month: "MAY", sales: 3500, revenue: 2600 },
  { month: "JUN", sales: 3000, revenue: 2400 },
  { month: "JUL", sales: 3300, revenue: 2800 },
  { month: "AUG", sales: 3100, revenue: 2600 },
  { month: "SEP", sales: 2900, revenue: 2500 },
  { month: "OCT", sales: 2700, revenue: 2600 },
  { month: "NOV", sales: 2400, revenue: 2200 },
  { month: "DEC", sales: 3600, revenue: 3000 },
];

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-bg-1 text-foreground font-sans">
      {/* -------------------- Main Content -------------------- */}
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-h2 font-semibold">Dashboard</h2>
        </div>

        {/* -------------------- Stat Cards -------------------- */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Daily Sales"
            value="$2k"
            subtitle="9 September 2025"
          />
          <StatCard
            title="Monthly Revenue"
            value="$55k"
            subtitle="Jan - Feb"
          />
          <StatCard
            title="Mostly visiting customers for Tomorrow"
            value="Age 20 - 40 Customers"
          />
        </div>

        {/* -------------------- Middle Cards -------------------- */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <PopularDishes />
          <PredictedMenu />
        </div>

        {/* -------------------- Overview Chart -------------------- */}
        <div className="bg-bg-2 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-h4 font-medium">Overview</h4>

            <div className="flex gap-2">
              {["Monthly", "Daily", "Weekly"].map((t) => (
                <button
                  key={t}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    t === "Monthly"
                      ? "bg-primary text-black"
                      : "bg-bg-1 text-gray-400"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#A78BFA"
                  strokeWidth={3}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}

/* -------------------- Reusable Inline Components -------------------- */

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-bg-2 rounded-2xl p-5">
      <p className="text-gray-400 text-sm">{title}</p>
      <h3 className="text-h3 font-semibold mt-2">{value}</h3>
      {subtitle && (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

function PopularDishes() {
  return (
    <div className="bg-bg-2 rounded-2xl p-6">
      <div className="flex justify-between mb-4">
        <h4 className="text-h4 font-medium">Popular Dishes</h4>
        <span className="text-primary text-sm cursor-pointer">
          See All
        </span>
      </div>

      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between bg-bg-1 rounded-xl p-4 mb-3"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gray-700" />
            <div>
              <p className="font-medium">Chicken Parmesan</p>
              <p className="text-xs text-gray-400">
                Serving: 01 person
              </p>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`text-xs ${
                i === 3 ? "text-red-500" : "text-green-400"
              }`}
            >
              {i === 3 ? "Out of stock" : "In Stock"}
            </span>
            <p className="text-sm mt-1">$55.00</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function PredictedMenu() {
  return (
    <div className="bg-bg-2 rounded-2xl p-6">
      <div className="flex justify-between mb-4">
        <h4 className="text-h4 font-medium">
          Predicted Menu For Tomorrow
        </h4>
        <span className="text-primary text-sm cursor-pointer">
          See All
        </span>
      </div>

      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between bg-bg-1 rounded-xl p-4 mb-3"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gray-700" />
            <div>
              <p className="font-medium">Egg Roti</p>
              <p className="text-xs text-gray-400">
                Demanding quantity: 300
              </p>
            </div>
          </div>

          <p className="text-sm">
            ${i === 2 ? "110.00" : "55.00"}
          </p>
        </div>
      ))}
    </div>
  );
}

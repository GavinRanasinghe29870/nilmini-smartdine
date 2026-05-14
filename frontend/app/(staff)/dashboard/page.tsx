"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API_BASE_URL = "http://localhost:5000/api";
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

type DashboardStat = {
  title: string;
  value: string;
  subtitle?: string;
  rawValue?: number;
  source?: string;
};

type PopularDish = {
  id?: string;
  productId?: string;
  productName: string;
  categoryName?: string;
  image?: string;
  price?: number;
  availability?: string;
  unitSold?: number;
  revenue?: number;
};

type PredictedMenuItem = {
  productId?: string;
  productName: string;
  categoryName?: string;
  image?: string;
  price?: number;
  availability?: string;
  predictedQuantity?: number;
  recommendedProductionQuantity?: number;
  confidence?: string;
  managerReviewRequired?: boolean;
};

type ChartRow = {
  label: string;
  date?: string;
  sales: number;
  revenue: number;
};

type DashboardData = {
  success: boolean;
  dateContext: {
    today: string;
    tomorrow: string;
    currentYear: string;
    monthStartDate: string;
    yearStartDate: string;
    timezone: string;
  };
  statCards: {
    dailySales: DashboardStat;
    monthlyRevenue: DashboardStat;
    tomorrowCustomerGroup: DashboardStat;
  };
  popularDishes: PopularDish[];
  predictedMenu: {
    menuDate: string;
    status: string;
    summary?: string;
    items: PredictedMenuItem[];
  };
  overview: {
    monthly: ChartRow[];
    daily: ChartRow[];
    weekly: ChartRow[];
  };
  warnings?: string[];
};

type OverviewMode = "monthly" | "daily" | "weekly";

function resolveImageUrl(image?: string) {
  const value = String(image || "").trim();

  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;

  if (value.startsWith("/uploads/")) return `${API_ORIGIN}${value}`;
  if (value.startsWith("uploads/")) return `${API_ORIGIN}/${value}`;

  return value;
}

function formatMoney(value?: number) {
  return `Rs. ${Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overviewMode, setOverviewMode] = useState<OverviewMode>("monthly");

  async function fetchDashboard(signal?: AbortSignal) {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/reports/dashboard`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
        signal,
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to load dashboard data");
      }

      setDashboard(payload);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    fetchDashboard(controller.signal);

    return () => controller.abort();
  }, []);

  const chartData = useMemo(() => {
    if (!dashboard) return [];
    return dashboard.overview[overviewMode] || [];
  }, [dashboard, overviewMode]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-1 text-foreground font-sans">
        <p className="text-gray-400">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-1 text-foreground font-sans">
        <div className="bg-bg-2 rounded-2xl p-6 text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2">Dashboard Error</h2>
          <p className="text-sm text-red-400 mb-4">{error}</p>
          <button
            onClick={() => fetchDashboard()}
            className="px-4 py-2 rounded-lg bg-primary text-black text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <div className="flex min-h-screen bg-bg-1 text-foreground font-sans">
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold">Dashboard</h2>
            <p className="text-sm text-gray-500 mt-1">
              Real-time overview from orders, products, reports, and AI menu data
            </p>
          </div>

          <button
            onClick={() => fetchDashboard()}
            className="px-4 py-2 rounded-lg bg-bg-2 text-sm text-gray-300 hover:text-white"
          >
            Refresh
          </button>
        </div>

        {dashboard.warnings && dashboard.warnings.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
            <p className="text-sm text-yellow-300">{dashboard.warnings[0]}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title={dashboard.statCards.dailySales.title}
            value={dashboard.statCards.dailySales.value}
            subtitle={dashboard.statCards.dailySales.subtitle}
          />
          <StatCard
            title={dashboard.statCards.monthlyRevenue.title}
            value={dashboard.statCards.monthlyRevenue.value}
            subtitle={dashboard.statCards.monthlyRevenue.subtitle}
          />
          <StatCard
            title={dashboard.statCards.tomorrowCustomerGroup.title}
            value={dashboard.statCards.tomorrowCustomerGroup.value}
            subtitle={dashboard.statCards.tomorrowCustomerGroup.subtitle}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <PopularDishes dishes={dashboard.popularDishes} />
          <PredictedMenu menu={dashboard.predictedMenu} />
        </div>

        <div className="bg-bg-2 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
            <div>
              <h4 className="text-lg font-medium">Overview</h4>
              <p className="text-xs text-gray-500 mt-1">
                Sales units and revenue from completed order data
              </p>
            </div>

            <div className="flex gap-2">
              {(["monthly", "daily", "weekly"] as OverviewMode[]).map(
                (mode) => (
                  <button
                    key={mode}
                    onClick={() => setOverviewMode(mode)}
                    className={`px-4 py-2 rounded-lg text-sm capitalize ${
                      overviewMode === mode
                        ? "bg-primary text-black"
                        : "bg-bg-1 text-gray-400"
                    }`}
                  >
                    {mode}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="label" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "revenue") {
                      return [formatMoney(Number(value)), "Revenue"];
                    }

                    return [Number(value), "Sales Units"];
                  }}
                  labelFormatter={(label) => `${overviewMode}: ${label}`}
                />
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
      <h3 className="text-h3 font-semibold mt-2 break-words">{value}</h3>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function PopularDishes({ dishes }: { dishes: PopularDish[] }) {
  return (
    <div className="bg-bg-2 rounded-2xl p-6">
      <div className="flex justify-between mb-4">
        <h4 className="text-h4 font-medium">Popular Dishes</h4>
        <span className="text-primary text-sm">This Month</span>
      </div>

      {dishes.length === 0 ? (
        <EmptyCardText message="No order data found for this month." />
      ) : (
        dishes.map((dish) => (
          <div
            key={dish.id || dish.productId || dish.productName}
            className="flex items-center justify-between bg-bg-1 rounded-xl p-4 mb-3 gap-4"
          >
            <div className="flex items-center gap-4 min-w-0">
              <ProductThumb image={dish.image} name={dish.productName} />
              <div className="min-w-0">
                <p className="font-medium truncate">{dish.productName}</p>
                <p className="text-xs text-gray-400">
                  Sold: {dish.unitSold || 0} units
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span
                className={`text-xs ${
                  dish.availability === "Out of Stock"
                    ? "text-red-500"
                    : "text-green-400"
                }`}
              >
                {dish.availability || "In Stock"}
              </span>
              <p className="text-sm mt-1">{formatMoney(dish.price)}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function PredictedMenu({
  menu,
}: {
  menu: DashboardData["predictedMenu"];
}) {
  return (
    <div className="bg-bg-2 rounded-2xl p-6">
      <div className="flex justify-between mb-4">
        <div>
          <h4 className="text-h4 font-medium">Predicted Menu For Tomorrow</h4>
          <p className="text-xs text-gray-500 mt-1">{menu.menuDate}</p>
        </div>

        <span className="text-primary text-sm capitalize">
          {menu.status.replace(/_/g, " ")}
        </span>
      </div>

      {menu.items.length === 0 ? (
        <EmptyCardText message="Tomorrow's AI menu has not been generated yet." />
      ) : (
        menu.items.map((item) => (
          <div
            key={item.productId || item.productName}
            className="flex items-center justify-between bg-bg-1 rounded-xl p-4 mb-3 gap-4"
          >
            <div className="flex items-center gap-4 min-w-0">
              <ProductThumb image={item.image} name={item.productName} />
              <div className="min-w-0">
                <p className="font-medium truncate">{item.productName}</p>
                <p className="text-xs text-gray-400">
                  Demanding quantity: {item.recommendedProductionQuantity || 0}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className="text-sm">{formatMoney(item.price)}</p>
              {item.managerReviewRequired && (
                <p className="text-xs text-yellow-400 mt-1">Review</p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ProductThumb({ image, name }: { image?: string; name: string }) {
  const src = resolveImageUrl(image);

  if (!src) {
    return (
      <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center text-xs text-gray-400 shrink-0">
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className="w-12 h-12 rounded-lg object-cover bg-gray-700 shrink-0"
      onError={(event) => {
        if (!event.currentTarget.src.endsWith("/images/placeholder.png")) {
          event.currentTarget.src = "/images/placeholder.png";
        } else {
          event.currentTarget.style.display = "none";
        }
      }}
    />
  );
}

function EmptyCardText({ message }: { message: string }) {
  return (
    <div className="bg-bg-1 rounded-xl p-5 text-center text-sm text-gray-400">
      {message}
    </div>
  );
}
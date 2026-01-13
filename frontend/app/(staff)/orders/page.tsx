"use client";

import DataTable, { Column } from "../../src/components/DataTable";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type OrderItem = {
  name: string;
  quantity: number;
  cost: number;
};

type Order = {
  id: string;
  date: string;
  time: string;
  ageGroup: string;
  groupSize: string;
  items: OrderItem[];
  weather: string;
  dayType: "Holiday" | "Work Day";
  totalCost: number;
};

const orders: Order[] = [
  {
    id: "ORD-001",
    date: "2026-01-06",
    time: "12:45 PM",
    ageGroup: "Young Adults",
    groupSize: "2",
    items: [
      { name: "Chicken Burger", quantity: 2, cost: 850 },
      { name: "French Fries", quantity: 1, cost: 400 },
    ],
    weather: "Rainy",
    dayType: "Work Day",
    totalCost: 2100,
  },
  {
    id: "ORD-002",
    date: "2026-01-06",
    time: "7:30 PM",
    ageGroup: "Youngers",
    groupSize: "1",
    items: [
      { name: "Pizza", quantity: 1, cost: 2200 },
      { name: "Soft Drink", quantity: 2, cost: 300 },
    ],
    weather: "Cloudy",
    dayType: "Holiday",
    totalCost: 2800,
  },
];

const columns: Column<Order>[] = [
  { key: "date", label: "Date" },
  { key: "time", label: "Time" },
  { key: "ageGroup", label: "Age Group" },
  { key: "groupSize", label: "Group Size", align: "center" },
  {
    key: "items",
    label: "Items",
    render: (row) => (
      <div className="space-y-1">
        {row.items.map((item, index) => (
          <div key={index} className="text-xs text-gray-300">
            {item.name} × {item.quantity}
          </div>
        ))}
      </div>
    ),
  },
  {
    key: "itemsCost",
    label: "Item Costs",
    render: (row) => (
      <div className="space-y-1">
        {row.items.map((item, index) => (
          <div key={index} className="text-xs text-gray-400">
            Rs. {item.cost}
          </div>
        ))}
      </div>
    ),
  },
  {
    key: "weather",
    label: "Weather",
    align: "center",
  },
  {
    key: "dayType",
    label: "Day Type",
    align: "center",
    render: (row) => (
      <span
        className={`px-3 py-1 rounded-full text-xs ${row.dayType === "Holiday"
          ? "bg-secondary text-black"
          : "bg-bg-1 text-white"
          }`}
      >
        {row.dayType}
      </span>
    ),
  },
  {
    key: "totalCost",
    label: "Order Cost (Rs.)",
    align: "right",
    render: (row) => (
      <span className="font-medium text-primary">
        Rs. {row.totalCost}
      </span>
    ),
  },
];

export default function OrderManagementPage() {
  const router = useRouter();

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full bg-bg-2 hover:bg-bg-1"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-h4 font-semibold">Order Management</h1>
      </div>

      {/* Top Bar */}
      <div className="mb-6">
        <h2 className="text-h5 font-medium">
          Orders <span className="text-gray-400">({orders.length})</span>
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Track orders, customer behavior, and environmental factors
        </p>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={orders} />
    </div>
  );
}

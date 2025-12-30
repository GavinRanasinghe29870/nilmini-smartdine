"use client";

import { ArrowLeft, Trash2 } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import DataTable, { Column } from "../../../src/components/DataTable";

/* TYPES */

type MenuItem = {
  id: string;
  productName: string;
  description: string;
  itemId: string;
  quantity: number;
  category: string;
  price: number;
  availability: string;
};

/* DATA */

const todayMenu: MenuItem[] = [
  {
    id: "1",
    productName: "Chicken Parmesan",
    description: "Breaded chicken with marinara and cheese",
    itemId: "#22314644",
    quantity: 119,
    category: "Chicken",
    price: 55,
    availability: "In Stock",
  },
  {
    id: "2",
    productName: "Chicken Parmesan",
    description: "Breaded chicken with marinara and cheese",
    itemId: "#22314645",
    quantity: 96,
    category: "Chicken",
    price: 55,
    availability: "In Stock",
  },
];

/* COLUMNS */

const columns: Column<MenuItem>[] = [
  {
    key: "product",
    label: "Product",
    render: (row) => (
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-bg-2">
          <img
            src="https://images.getrecipekit.com/20220308185802-chicken_parm.jpeg?aspect_ratio=16:9&quality=90"
            alt={row.productName}
            className="w-full h-full object-cover"
          />
        </div>

        <div>
          <p className="font-medium text-text-white">{row.productName}</p>
          <p className="text-xs text-gray-400">{row.description}</p>
        </div>
      </div>
    ),
  },
  { key: "itemId", label: "Item ID", align: "center" },
  {
    key: "quantity",
    label: "Quantity",
    align: "center",
    render: (r) => `${r.quantity} items`,
  },
  { key: "category", label: "Category", align: "center" },
  {
    key: "price",
    label: "Price",
    align: "right",
    render: (r) => `$${r.price.toFixed(2)}`,
  },
  {
    key: "availability",
    label: "Availability",
    align: "center",
    render: (r) => (
      <div className="flex items-center justify-center gap-3">
        <span className="text-primary font-medium">In Stock</span>
        <button
          className="p-2 rounded-md text-red-400 hover:bg-bg-2 hover:text-red-300 transition"
          title="Delete item"
          onClick={() => {
            // delete logic
            console.log("Delete item:", r.id);
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    ),
  },
];

/* COMPONENT */

export default function TodayMenuPage() {
  const router = useRouter();
  const pathname = usePathname();

  const isTomorrow = pathname.includes("/menu/predicted");
  const isToday = pathname.includes("/menu/today");

  return (
    <main className="flex-1 p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full bg-bg-2 hover:bg-bg-1 transition"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-h4 font-semibold">Menu</h1>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => router.push("/menu/predictedMenu")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${isTomorrow
              ? "bg-primary text-text-black"
              : "text-gray-400 hover:text-gray-200"
            }`}
        >
          Tomorrow Predicted Menu
        </button>

        <button
          onClick={() => router.push("/menu/todayMenu")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${isToday
              ? "bg-primary text-text-black"
              : "text-gray-400 hover:text-gray-200"
            }`}
        >
          Today Menu
        </button>
      </div>

      {/* Page Title */}
      <div className="mb-6">
        <h2 className="text-h5 font-medium">
          Today Menu <span className="text-gray-400">({todayMenu.length})</span>
        </h2>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={todayMenu} />
    </main>
  );
}

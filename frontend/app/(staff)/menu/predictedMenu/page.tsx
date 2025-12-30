"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import DataTable, { Column } from "../../../src/components/DataTable";
import Image from "next/image";


/* TYPES */

type MenuItem = {
  id: string;
  productName: string;
  description: string;
  itemId: string;
  predictedQuantity: number;
  category: string;
  price: number;
  availability: string;
};

/* DATA */

const tomorrowMenu: MenuItem[] = [
  {
    id: "1",
    productName: "Chicken Parmesan",
    description: "Breaded chicken with marinara and cheese",
    itemId: "#22314644",
    predictedQuantity: 119,
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
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-bg-1 relative">
          <Image
            src="https://images.getrecipekit.com/20220308185802-chicken_parm.jpeg?aspect_ratio=16:9&quality=90"
            alt={row.productName}
            fill
            unoptimized
          />
        </div>
        <div>
          <p className="font-medium text-text-white">{row.productName}</p>
          <p className="text-xs text-text-white">{row.description}</p>
        </div>
      </div>
    ),
  },
  { key: "itemId", label: "Item ID", align: "center" },
  {
    key: "predictedQuantity",
    label: "Predicted Quantity",
    align: "center",
    render: (r) => `${r.predictedQuantity} items`,
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
       <span className="text-primary font-medium">In Stock</span>
    ),
  },
];

// COMPONENT 

export default function PredictedMenuPage() {
  const router = useRouter();
  const pathname = usePathname();

  const isTomorrow = pathname.includes("predicted");
  const isToday = pathname.includes("today");

  return (
    <main className="flex-1 p-8">
      {/* Header  */}
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

      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-h5 font-medium">
          Menu Items <span className="text-gray-400">({tomorrowMenu.length})</span>
        </h2>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={tomorrowMenu} />

      <div className="flex justify-end">
        <button className="px-4 py-2 bg-primary text-text-black rounded-lg hover:opacity-90 transition">
          Publish Menu
        </button>
      </div>

    </main>
  );
}

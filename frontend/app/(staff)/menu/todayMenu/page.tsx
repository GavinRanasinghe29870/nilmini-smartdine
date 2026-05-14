"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

import DataTable, { Column } from "../../../src/components/DataTable";
import { getTodayAiMenu } from "../../../src/lib/api/aiMenu.api";
import { GeneratedAiMenu } from "../../../src/types/aiMenu";

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

export default function TodayMenuPage() {
  const router = useRouter();
  const pathname = usePathname();

  const isTomorrow = pathname.includes("/menu/predicted");
  const isToday = pathname.includes("/menu/today");

  const [todayMenuDoc, setTodayMenuDoc] = useState<GeneratedAiMenu | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTodayMenu = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getTodayAiMenu();

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch today's menu");
      }

      setTodayMenuDoc(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayMenu();

    const interval = setInterval(() => {
      fetchTodayMenu();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchTodayMenu]);

  const todayMenu: MenuItem[] = useMemo(() => {
    if (!todayMenuDoc?.menuItems) return [];

    return todayMenuDoc.menuItems.map((item, index) => {
      const predictedQuantity = Number(item.predictedQuantity || 0);

      return {
        id: item._id || `${todayMenuDoc._id}-${index}`,
        productName: item.productName,
        description:
          item.reason ||
          "Approved AI menu item based on next-day demand prediction",
        itemId: `#MENU-${String(index + 1).padStart(4, "0")}`,
        quantity: predictedQuantity,
        category: "AI Menu",
        price: 0,
        availability: "In Stock",
      };
    });
  }, [todayMenuDoc]);

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
      label: "Predicted Quantity",
      align: "center",
      render: (r) => `${r.quantity} items`,
    },
    { key: "category", label: "Category", align: "center" },
    {
      key: "price",
      label: "Price",
      align: "right",
      render: (r) => (r.price > 0 ? `$${r.price.toFixed(2)}` : "-"),
    },
    {
      key: "availability",
      label: "Availability",
      align: "center",
      render: (r) => (
        <div className="flex items-center justify-center gap-3">
          <span className="text-primary font-medium">{r.availability}</span>

          <button
            className="p-2 rounded-md text-red-400 hover:bg-bg-2 hover:text-red-300 transition"
            title="Delete item"
            onClick={() => {
              console.log("Delete item:", r.id);
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <main className="flex-1 p-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full bg-bg-2 hover:bg-bg-1 transition"
        >
          <ArrowLeft size={18} />
        </button>

        <div>
          <h1 className="text-h4 font-semibold">Menu</h1>

          {todayMenuDoc && (
            <p className="text-sm text-gray-400 mt-1">
              Approved menu for {todayMenuDoc.menuDate}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => router.push("/menu/predictedMenu")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            isTomorrow
              ? "bg-primary text-text-black"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Tomorrow Predicted Menu
        </button>

        <button
          onClick={() => router.push("/menu/todayMenu")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            isToday
              ? "bg-primary text-text-black"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Today Menu
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-h5 font-medium">
          Today Menu <span className="text-gray-400">({todayMenu.length})</span>
        </h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="animate-spin mr-2" size={20} />
          Loading today menu...
        </div>
      ) : todayMenu.length > 0 ? (
        <DataTable columns={columns} data={todayMenu} />
      ) : (
        <div className="rounded-xl bg-bg-2 p-10 text-center">
          <p className="text-gray-300">
            No approved menu is available for today yet.
          </p>

          <p className="text-sm text-gray-500 mt-2">
            Tomorrow&apos;s predicted menu will appear here after it is approved
            and the date changes to 12.00 a.m.
          </p>
        </div>
      )}
    </main>
  );
}
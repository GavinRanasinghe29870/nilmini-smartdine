"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Sparkles, UsersRound } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";

import DataTable, { Column } from "../../../src/components/DataTable";
import {
  approveGeneratedAiMenu,
  generateAiMenu,
  getGeneratedAiMenus,
} from "../../../src/lib/api/aiMenu.api";
import { GeneratedAiMenu } from "../../../src/types/aiMenu";

type MenuItem = {
  id: string;
  productName: string;
  productImage: string;
  itemId: string;
  predictedQuantity: number;
  adjustedQuantity: number;
  category: string;
  price: number;
  availability: string;
  confidence: string;
  isPreferredForPredictedGroup: boolean;
  customerPreferenceNote: string;
};

const TIME_ZONE = "Asia/Colombo";

const fallbackImage =
  "https://images.getrecipekit.com/20220308185802-chicken_parm.jpeg?aspect_ratio=16:9&quality=90";

const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_ORIGIN || "http://localhost:5000";

function getImageUrl(image?: string) {
  if (!image) return fallbackImage;

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  if (image.startsWith("/uploads")) {
    return `${API_ORIGIN}${image}`;
  }

  return image;
}

function getColomboDateString(offsetDays = 0) {
  const now = new Date();
  const targetDate = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(targetDate);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function isAfterFivePmColombo(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const hour = Number(parts.find((p) => p.type === "hour")?.value || 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value || 0);

  return hour > 17 || (hour === 17 && minute >= 0);
}

function formatNumber(value: number) {
  const rounded = Math.round(Number(value || 0) * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

export default function PredictedMenuPage() {
  const router = useRouter();
  const pathname = usePathname();

  const isTomorrow = pathname.includes("/menu/predicted");
  const isToday = pathname.includes("/menu/today");

  const [selectedMenu, setSelectedMenu] = useState<GeneratedAiMenu | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(new Date());

  const canApprove = isAfterFivePmColombo(now);

  const fetchLatestGeneratedMenu = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getGeneratedAiMenus();

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch generated menus");
      }

      const latestMenu = result.data?.[0] || null;
      setSelectedMenu(latestMenu);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGenerateTomorrowMenu = async () => {
    try {
      setGenerating(true);
      setError("");

      const result = await generateAiMenu({
        predictionDate: getColomboDateString(1),
        weatherType: "Normal",
        holiday: "No",
        forceRegenerate: true,
      });

      if (!result.success) {
        throw new Error(result.message || "Failed to generate AI menu");
      }

      setSelectedMenu(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  const handleApproveMenu = async () => {
    if (!selectedMenu?._id) {
      setError("No generated menu selected to approve");
      return;
    }

    if (!canApprove) {
      setError("Approve Menu can be clicked only after 5.00 p.m.");
      return;
    }

    try {
      setApproving(true);
      setError("");

      const result = await approveGeneratedAiMenu(selectedMenu._id);

      if (!result.success) {
        throw new Error(result.message || "Failed to approve menu");
      }

      setSelectedMenu(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setApproving(false);
    }
  };

  useEffect(() => {
    fetchLatestGeneratedMenu();
  }, [fetchLatestGeneratedMenu]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  const tomorrowMenu: MenuItem[] = useMemo(() => {
    if (!selectedMenu?.menuItems) return [];

    return selectedMenu.menuItems.map((item, index) => {
      const predictedQuantity = Number(item.predictedQuantity || 0);
      const adjustedQuantity = Number(
        item.adjustedQuantity ?? item.predictedQuantity ?? 0
      );

      return {
        id: item._id || `${selectedMenu._id}-${index}`,
        productName: item.productName,
        productImage: item.productImage || "",
        itemId: `#AI-${String(index + 1).padStart(4, "0")}`,
        predictedQuantity,
        adjustedQuantity,
        category: item.categoryName || "AI Menu",
        price: Number(item.price || 0),
        availability: item.availability || "In Stock",
        confidence: item.confidence || "Review",
        isPreferredForPredictedGroup: Boolean(
          item.isPreferredForPredictedGroup
        ),
        customerPreferenceNote: item.customerPreferenceNote || "",
      };
    });
  }, [selectedMenu]);

  const adjustedProducts = useMemo(() => {
    if (Array.isArray(selectedMenu?.adjustedProducts)) {
      return selectedMenu.adjustedProducts;
    }

    if (!selectedMenu?.menuItems) return [];

    return selectedMenu.menuItems
      .map((item) => {
        const predictedQuantity = Number(item.predictedQuantity || 0);
        const adjustedQuantity = Number(
          item.adjustedQuantity ?? item.predictedQuantity ?? 0
        );

        return {
          productName: item.productName,
          predictedQuantity,
          adjustedQuantity,
          adjustmentValue: adjustedQuantity - predictedQuantity,
          adjustmentPercent:
            predictedQuantity > 0
              ? ((adjustedQuantity - predictedQuantity) / predictedQuantity) *
                100
              : 0,
          preferenceScore: item.preferenceScore,
          reason:
            item.adjustmentReason ||
            item.customerPreferenceNote ||
            "Adjusted based on customer preference.",
        };
      })
      .filter((item) => Math.abs(item.adjustmentValue) > 0);
  }, [selectedMenu]);

  const columns: Column<MenuItem>[] = [
    {
      key: "product",
      label: "Product",
      render: (row) => (
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-bg-1 relative">
            <Image
              src={getImageUrl(row.productImage)}
              alt={row.productName}
              fill
              unoptimized
              className="object-cover"
            />
          </div>

          <div>
            <p className="font-medium text-text-white">{row.productName}</p>

            {row.isPreferredForPredictedGroup && (
              <p className="text-xs text-primary mt-1">
                Preferred by predicted customer group
              </p>
            )}
          </div>
        </div>
      ),
    },
    { key: "itemId", label: "Item ID", align: "center" },
    {
      key: "predictedQuantity",
      label: "ML Predicted",
      align: "center",
      render: (r) => `${formatNumber(r.predictedQuantity)} items`,
    },
    {
      key: "adjustedQuantity",
      label: "Final Menu Quantity",
      align: "center",
      render: (r) => (
        <span className="text-primary font-medium">
          {formatNumber(r.adjustedQuantity)} items
        </span>
      ),
    },
    { key: "category", label: "Category", align: "center" },
    {
      key: "price",
      label: "Price",
      align: "right",
      render: (r) => (r.price > 0 ? `Rs. ${r.price.toFixed(2)}` : "-"),
    },
    {
      key: "confidence",
      label: "Confidence",
      align: "center",
      render: (r) => (
        <span className="text-primary font-medium capitalize">
          {r.confidence}
        </span>
      ),
    },
    {
      key: "availability",
      label: "Availability",
      align: "center",
      render: () => <span className="text-primary font-medium">In Stock</span>,
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

          {selectedMenu && (
            <p className="text-sm text-gray-400 mt-1">
              AI generated menu for {selectedMenu.menuDate} • Status:{" "}
              <span className="capitalize text-primary">
                {selectedMenu.status}
              </span>
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

      {selectedMenu?.summary && (
        <div className="mb-5 rounded-xl bg-bg-2 p-4">
          <p className="text-sm text-gray-300">{selectedMenu.summary}</p>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-h5 font-medium">
          Menu Items{" "}
          <span className="text-gray-400">({tomorrowMenu.length})</span>
        </h2>

        <button
          onClick={handleGenerateTomorrowMenu}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 bg-bg-2 text-text-white rounded-lg hover:bg-bg-1 transition disabled:opacity-60"
        >
          {generating ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}

          {generating ? "Generating..." : "Generate AI Menu"}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="animate-spin mr-2" size={20} />
          Loading generated menu...
        </div>
      ) : tomorrowMenu.length > 0 ? (
        <DataTable columns={columns} data={tomorrowMenu} />
      ) : (
        <div className="rounded-xl bg-bg-2 p-10 text-center">
          <p className="text-gray-300 mb-4">
            No AI predicted menu has been generated yet.
          </p>

          <button
            onClick={handleGenerateTomorrowMenu}
            disabled={generating}
            className="px-4 py-2 bg-primary text-text-black rounded-lg hover:opacity-90 transition disabled:opacity-60"
          >
            {generating ? "Generating..." : "Generate Tomorrow Menu"}
          </button>
        </div>
      )}

      {selectedMenu && tomorrowMenu.length > 0 && (
        <div className="mt-6 rounded-xl bg-bg-2 border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-3">
            <UsersRound size={18} className="text-primary" />
            <h3 className="text-base font-semibold text-text-white">
              Customer Preference Adjustment
            </h3>
          </div>

          <p className="text-sm text-gray-300">
            Tomorrow most visiting customer group:{" "}
            <span className="text-primary font-medium">
              {selectedMenu.customerPreference?.predictedCustomerGroup ||
                "Not available"}
            </span>
          </p>

          {typeof selectedMenu.customerPreference?.confidencePercentage ===
            "number" && (
            <p className="text-xs text-gray-400 mt-1">
              Confidence:{" "}
              {selectedMenu.customerPreference.confidencePercentage.toFixed(2)}%
            </p>
          )}

          <div className="mt-4">
            <p className="text-sm font-medium text-text-white mb-2">
              Adjusted products
            </p>

            {adjustedProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {adjustedProducts.map((item) => (
                  <div
                    key={item.productName}
                    className="rounded-lg bg-bg-1 px-4 py-3 border border-white/5"
                  >
                    <p className="text-sm font-medium text-text-white">
                      {item.productName}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      ML: {formatNumber(item.predictedQuantity)} → Final:{" "}
                      <span className="text-primary">
                        {formatNumber(item.adjustedQuantity)}
                      </span>
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      Change: {formatNumber(item.adjustmentValue)} items (
                      {formatNumber(item.adjustmentPercent)}%)
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                No product quantity was adjusted by Gemini for this generated
                menu.
              </p>
            )}
          </div>
        </div>
      )}

      {tomorrowMenu.length > 0 && (
        <div className="flex justify-end mt-6">
          <div
            className="relative group"
            title={
              !canApprove
                ? "Approve Menu can be clicked only after 5.00 p.m."
                : ""
            }
          >
            <button
              onClick={handleApproveMenu}
              disabled={
                approving || selectedMenu?.status === "approved" || !canApprove
              }
              className="px-4 py-2 bg-primary text-text-black rounded-lg hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {selectedMenu?.status === "approved"
                ? "Menu Approved"
                : approving
                ? "Approving..."
                : "Approve Menu"}
            </button>

            {!canApprove && (
              <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-72 rounded-md bg-bg-2 px-3 py-2 text-xs text-gray-200 shadow-lg border border-white/10">
                Approve Menu can be clicked only after 5.00 p.m.
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
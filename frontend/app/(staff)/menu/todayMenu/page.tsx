"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ClipboardList,
  Loader2,
  RefreshCcw,
  UsersRound,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

import DataTable, { Column } from "../../../src/components/DataTable";
import { getTodayAiMenu } from "../../../src/lib/api/aiMenu.api";
import { getImageSrc, getProducts } from "../../../src/lib/api/product.api";
import type {
  AdjustedProduct,
  GeneratedAiMenu,
  GeneratedAiMenuItem,
} from "../../../src/types/aiMenu";
import type { ProductDto } from "../../../src/types/product";
import IngredientListModal from "../IngredientListModal";

type TodayMenuItem = {
  id: string;
  productName: string;
  productImage: string;
  itemId: string;
  quantity: number;
  category: string;
  price: number;
  availability: string;
  isPreferredForPredictedGroup: boolean;
  customerPreferenceNote: string;
};

const fallbackImage = "/images/placeholder.png";

function normalizeText(value?: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9\s#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactText(value?: string) {
  return normalizeText(value).replace(/\s+/g, "");
}

function getMatchKeys(value?: string) {
  const normalized = normalizeText(value);
  const compact = compactText(value);

  const keys = new Set<string>();

  if (normalized) keys.add(normalized);
  if (compact) keys.add(compact);

  return keys;
}

function buildProductMap(products: ProductDto[]) {
  const map = new Map<string, ProductDto>();

  for (const product of products) {
    const productNameKeys = getMatchKeys(product.name);
    const itemIdKeys = getMatchKeys(product.itemId);

    for (const key of [...productNameKeys, ...itemIdKeys]) {
      if (!map.has(key)) {
        map.set(key, product);
      }
    }
  }

  return map;
}

function findProductForMenuItem(
  productMap: Map<string, ProductDto>,
  item: GeneratedAiMenuItem
) {
  const possibleValues = [item.productName, item.productDbName, item.itemId];

  for (const value of possibleValues) {
    for (const key of getMatchKeys(value)) {
      const product = productMap.get(key);

      if (product) {
        return product;
      }
    }
  }

  return null;
}

function formatNumber(value: number) {
  const rounded = Math.round(Number(value || 0) * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

function formatMoney(value: number) {
  return `Rs. ${Number(value || 0).toFixed(2)}`;
}

function getLiveMenuQuantity(item: GeneratedAiMenuItem) {
  const quantity = Number(
    item.recommendedProductionQuantity ??
      item.adjustedQuantity ??
      item.predictedQuantity ??
      0
  );

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return 0;
  }

  return Math.floor(quantity);
}

function getDisplayAvailability(item: GeneratedAiMenuItem) {
  const quantity = getLiveMenuQuantity(item);

  if (quantity <= 0) {
    return "Out of Stock";
  }

  return "In Stock";
}

function getFinalItemId(
  menuItem: GeneratedAiMenuItem,
  matchedProduct: ProductDto | null,
  index: number
) {
  const productItemId = String(matchedProduct?.itemId || "").trim();
  const menuItemId = String(menuItem.itemId || "").trim();

  if (productItemId) return productItemId;
  if (menuItemId) return menuItemId;

  return `#AI-${String(index + 1).padStart(4, "0")}`;
}

export default function TodayMenuPage() {
  const router = useRouter();
  const pathname = usePathname();

  const isTomorrow = pathname.includes("/menu/predicted");
  const isToday = pathname.includes("/menu/today");

  const [todayMenu, setTodayMenu] = useState<GeneratedAiMenu | null>(null);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [ingredientModalOpen, setIngredientModalOpen] = useState(false);
  const [error, setError] = useState("");

  const fetchPageData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [menuResult, productData] = await Promise.all([
        getTodayAiMenu(),
        getProducts(),
      ]);

      if (!menuResult.success) {
        throw new Error(menuResult.message || "Failed to fetch today menu");
      }

      setTodayMenu(menuResult.data || null);
      setProducts(productData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setTodayMenu(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const productMap = useMemo(() => {
    return buildProductMap(products);
  }, [products]);

  const todayMenuItems: TodayMenuItem[] = useMemo(() => {
    if (!todayMenu?.menuItems) return [];

    return todayMenu.menuItems.map((item, index) => {
      const matchedProduct = findProductForMenuItem(productMap, item);

      const quantity = getLiveMenuQuantity(item);
      const availability = getDisplayAvailability(item);
      const productImage = matchedProduct?.image || item.productImage || "";

      return {
        id: item._id || `${todayMenu._id}-${index}`,
        productName:
          item.productName || matchedProduct?.name || "Unknown Product",
        productImage,
        itemId: getFinalItemId(item, matchedProduct, index),
        quantity,
        category: matchedProduct?.categoryName || item.categoryName || "AI Menu",
        price: Number(matchedProduct?.price ?? item.price ?? 0),
        availability,
        isPreferredForPredictedGroup: Boolean(item.isPreferredForPredictedGroup),
        customerPreferenceNote: item.customerPreferenceNote || "",
      };
    });
  }, [todayMenu, productMap]);

  const adjustedProducts = useMemo<AdjustedProduct[]>(() => {
    if (Array.isArray(todayMenu?.adjustedProducts)) {
      return todayMenu.adjustedProducts;
    }

    if (!todayMenu?.menuItems) return [];

    return todayMenu.menuItems
      .map((item) => {
        const predictedQuantity = Number(item.predictedQuantity || 0);
        const adjustedQuantity = Number(
          item.adjustedQuantity ??
            item.recommendedProductionQuantity ??
            item.predictedQuantity ??
            0
        );

        return {
          productName: item.productName || "Unknown Product",
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
  }, [todayMenu]);

  const columns: Column<TodayMenuItem>[] = [
    {
      key: "product",
      label: "Product",
      render: (row) => {
        const imageSrc = getImageSrc(row.productImage, fallbackImage);

        return (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-bg-1 relative">
              <Image
                src={imageSrc}
                alt={row.productName}
                fill
                unoptimized
                className="object-cover"
                onError={(event) => {
                  event.currentTarget.src = fallbackImage;
                }}
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
        );
      },
    },
    { key: "itemId", label: "Item ID", align: "center" },
    {
      key: "quantity",
      label: "Quantity",
      align: "center",
      render: (row) => (
        <span
          className={
            row.quantity <= 0
              ? "text-red-400 font-semibold"
              : "text-primary font-medium"
          }
        >
          {formatNumber(row.quantity)} items
        </span>
      ),
    },
    { key: "category", label: "Category", align: "center" },
    {
      key: "price",
      label: "Price",
      align: "right",
      render: (row) => (row.price > 0 ? formatMoney(row.price) : "-"),
    },
    {
      key: "availability",
      label: "Availability",
      align: "center",
      render: (row) => (
        <span
          className={
            row.availability === "Out of Stock"
              ? "text-red-400 font-semibold"
              : "text-green-400 font-semibold"
          }
        >
          {row.availability}
        </span>
      ),
    },
  ];

  const ingredientList = todayMenu?.ingredientList || [];
  const inventoryRequirementList = todayMenu?.inventoryRequirementList || [];

  return (
    <main className="flex-1 p-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full bg-bg-2 hover:bg-bg-1 transition"
          type="button"
        >
          <ArrowLeft size={18} />
        </button>

        <div>
          <h1 className="text-h4 font-semibold">Menu</h1>

          {todayMenu ? (
            <p className="text-sm text-gray-400 mt-1">
              Today approved menu for {todayMenu.menuDate} • Status:{" "}
              <span className="capitalize text-primary">
                {todayMenu.status}
              </span>
            </p>
          ) : (
            <p className="text-sm text-gray-400 mt-1">
              Today approved menu is not available yet.
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
          type="button"
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
          type="button"
        >
          Today Menu
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {todayMenu?.summary && (
        <div className="mb-5 rounded-xl bg-bg-2 p-4">
          <p className="text-sm text-gray-300">{todayMenu.summary}</p>
        </div>
      )}

      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h2 className="text-h5 font-medium">
          Today Menu Items{" "}
          <span className="text-gray-400">({todayMenuItems.length})</span>
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIngredientModalOpen(true)}
            disabled={
              ingredientList.length === 0 &&
              inventoryRequirementList.length === 0
            }
            className="flex items-center gap-2 px-4 py-2 bg-bg-2 text-text-white rounded-lg hover:bg-bg-1 transition disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            <ClipboardList size={16} />
            Inventory List
          </button>

          <button
            onClick={fetchPageData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-bg-2 text-text-white rounded-lg hover:bg-bg-1 transition disabled:opacity-60"
            type="button"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCcw size={16} />
            )}
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="animate-spin mr-2" size={20} />
          Loading today menu...
        </div>
      ) : todayMenuItems.length > 0 ? (
        <DataTable columns={columns} data={todayMenuItems} />
      ) : (
        <div className="rounded-xl bg-bg-2 p-10 text-center">
          <p className="text-gray-300 mb-2">
            No approved Today Menu is available.
          </p>
          <p className="text-sm text-gray-400">
            Approved predicted menus will appear here on the selected menu date.
          </p>
        </div>
      )}

      {todayMenu && todayMenuItems.length > 0 && (
        <div className="mt-6 rounded-xl bg-bg-2 border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-3">
            <UsersRound size={18} className="text-primary" />
            <h3 className="text-base font-semibold text-text-white">
              Customer Preference Adjustment
            </h3>
          </div>

          <p className="text-sm text-gray-300">
            Predicted most visiting customer group:{" "}
            <span className="text-primary font-medium">
              {todayMenu.customerPreference?.predictedCustomerGroup ||
                "Not available"}
            </span>
          </p>

          {typeof todayMenu.customerPreference?.confidencePercentage ===
            "number" && (
            <p className="text-xs text-gray-400 mt-1">
              Customer group prediction confidence:{" "}
              {todayMenu.customerPreference.confidencePercentage.toFixed(2)}%
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
                No product quantity was adjusted for this menu.
              </p>
            )}
          </div>
        </div>
      )}

      <IngredientListModal
        open={ingredientModalOpen}
        onClose={() => setIngredientModalOpen(false)}
        menuDate={todayMenu?.menuDate}
        ingredientList={ingredientList}
        inventoryRequirementList={inventoryRequirementList}
      />
    </main>
  );
}
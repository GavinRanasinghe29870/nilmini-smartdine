/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart as ShoppingCartIcon,
  Grid3x3,
  Pizza,
  Hamburger,
  Drumstick,
  Croissant,
  CupSoda,
  Fish,
  Trash2,
  LucideIcon,
} from "lucide-react";

import SingleProductModal from "../SingleProductModal";
import {
  getCategories,
  getImageSrc,
  getProducts,
} from "../../src/lib/api/product.api";
import { createOrder } from "../../src/lib/api/order.api";
import { getTodayAiMenu } from "../../src/lib/api/aiMenu.api";
import type { CategoryDto } from "../../src/types/category";
import type { ProductDto } from "../../src/types/product";
import type { DayType } from "../../src/types/order";
import type { GeneratedAiMenu, GeneratedAiMenuItem } from "../../src/types/aiMenu";

const iconMap: Record<string, LucideIcon> = {
  Grid3x3,
  Pizza,
  Hamburger,
  Drumstick,
  Croissant,
  CupSoda,
  Fish,
};

type CartItem = {
  productId: string;
  name: string;
  categoryName: string;
  image: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type OrderForm = {
  ageGroup: string;
  groupSize: string;
  weather: string;
  dayType: DayType;
};

type TodayMenuStock = {
  productId?: string;
  itemId?: string;
  productName: string;
  quantity: number;
  availability: string;
};

type ProductWithMenuStock = ProductDto & {
  todayMenuQuantity?: number;
  todayMenuAvailability?: string;
  isInTodayMenu?: boolean;
};

function toNumber(value: number | string | undefined | null) {
  const result = Number(value);

  if (!Number.isFinite(result)) {
    return 0;
  }

  return result;
}

function normalizeText(value?: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
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

function getMenuItemLiveQuantity(item: GeneratedAiMenuItem) {
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

function buildTodayMenuStockMap(menu: GeneratedAiMenu | null) {
  const map = new Map<string, TodayMenuStock>();

  if (!menu || menu.status !== "approved" || !Array.isArray(menu.menuItems)) {
    return map;
  }

  menu.menuItems.forEach((item: GeneratedAiMenuItem) => {
    const liveQuantity = getMenuItemLiveQuantity(item);

    const stock: TodayMenuStock = {
      productId: item.productId,
      itemId: item.itemId,
      productName: item.productName,
      quantity: liveQuantity,
      availability: liveQuantity <= 0 ? "Out of Stock" : "In Stock",
    };

    const values = [
      item.productId,
      item.itemId,
      item.productDbName,
      item.productName,
    ];

    values.forEach((value) => {
      getMatchKeys(value).forEach((key) => {
        if (!map.has(key)) {
          map.set(key, stock);
        }
      });
    });
  });

  return map;
}

function findTodayMenuStock(
  stockMap: Map<string, TodayMenuStock>,
  product: ProductDto
) {
  const values = [product.id, product.itemId, product.name];

  for (const value of values) {
    for (const key of getMatchKeys(value)) {
      const stock = stockMap.get(key);

      if (stock) {
        return stock;
      }
    }
  }

  return null;
}

function getProductIngredients(product: ProductDto | null) {
  if (!product?.ingredients || !Array.isArray(product.ingredients)) {
    return [];
  }

  return product.ingredients.map((ingredient) => {
    const name = ingredient.name?.trim() || "Ingredient";
    const quantity = ingredient.quantity?.trim() || "";
    const unit = ingredient.unit?.trim() || "";

    return `${name}: ${quantity} ${unit}`.trim();
  });
}

export default function ProductPlacingPage() {
  const router = useRouter();

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [todayMenu, setTodayMenu] = useState<GeneratedAiMenu | null>(null);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [quantity, setQuantity] = useState(1);

  const [selectedProduct, setSelectedProduct] =
    useState<ProductWithMenuStock | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [isOrderPopupOpen, setIsOrderPopupOpen] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [orderForm] = useState<OrderForm>({
    ageGroup: "Not Provided",
    groupSize: "1",
    weather: "Normal",
    dayType: "Work Day",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [productData, categoryData, todayMenuResponse] =
        await Promise.all([getProducts(), getCategories(), getTodayAiMenu()]);

      setProducts(productData);
      setCategories(categoryData);
      setTodayMenu(todayMenuResponse.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const todayMenuStockMap = useMemo(() => {
    return buildTodayMenuStockMap(todayMenu);
  }, [todayMenu]);

  const displayProducts = useMemo<ProductWithMenuStock[]>(() => {
    const hasTodayMenu = todayMenu?.status === "approved";

    return products
      .map((product) => {
        const todayStock = findTodayMenuStock(todayMenuStockMap, product);

        if (!hasTodayMenu) {
          return {
            ...product,
            todayMenuQuantity: undefined,
            todayMenuAvailability: product.availability,
            isInTodayMenu: false,
          };
        }

        if (!todayStock) {
          return null;
        }

        return {
          ...product,
          todayMenuQuantity: todayStock.quantity,
          todayMenuAvailability: todayStock.availability,
          availability:
            todayStock.quantity <= 0 ? "Out of Stock" : product.availability,
          isInTodayMenu: true,
        };
      })
      .filter(Boolean) as ProductWithMenuStock[];
  }, [products, todayMenu, todayMenuStockMap]);

  const allCategories = useMemo(() => {
    return [
      {
        id: "all",
        name: "All",
        description: "All available products",
        count: displayProducts.length,
        icon: "Grid3x3",
        image: "",
      },
      ...categories.map((category) => ({
        ...category,
        count: displayProducts.filter(
          (product) => product.categoryName === category.name
        ).length,
      })),
    ];
  }, [categories, displayProducts]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "All") {
      return displayProducts;
    }

    return displayProducts.filter(
      (item) => item.categoryName === selectedCategory
    );
  }, [displayProducts, selectedCategory]);

  const cartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
  }, [cartItems]);

  const getAvailableQuantityForProduct = (productId: string) => {
    const product = displayProducts.find((item) => item.id === productId);

    if (!product) return undefined;

    return product.todayMenuQuantity;
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    const selectedProductWithMongoId = selectedProduct as ProductDto & {
      _id?: string;
    };

    const productId =
      selectedProduct.id || selectedProductWithMongoId._id || "";

    if (!productId) {
      setError("Product ID is missing. Please refresh and try again.");
      return;
    }

    const availableQuantity = selectedProduct.todayMenuQuantity;

    if (
      selectedProduct.availability === "Out of Stock" ||
      selectedProduct.todayMenuAvailability === "Out of Stock" ||
      availableQuantity === 0
    ) {
      setError("This product is out of stock in today's menu.");
      return;
    }

    const existingCartQuantity =
      cartItems.find((item) => item.productId === productId)?.quantity || 0;

    if (
      availableQuantity !== undefined &&
      existingCartQuantity + quantity > availableQuantity
    ) {
      setError(
        `Only ${availableQuantity} item(s) available in today's menu for ${selectedProduct.name}.`
      );
      return;
    }

    const unitPrice = toNumber(selectedProduct.price);

    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.productId === productId);

      if (existingItem) {
        return prev.map((item) => {
          if (item.productId !== productId) {
            return item;
          }

          const newQuantity = item.quantity + quantity;

          return {
            ...item,
            quantity: newQuantity,
            lineTotal: Number((newQuantity * item.unitPrice).toFixed(2)),
          };
        });
      }

      return [
        ...prev,
        {
          productId,
          name: selectedProduct.name,
          categoryName: selectedProduct.categoryName || "",
          image: selectedProduct.image || "",
          quantity,
          unitPrice,
          lineTotal: Number((quantity * unitPrice).toFixed(2)),
        },
      ];
    });

    setQuantity(1);
    setIsModalOpen(false);
  };

  const handleQuantityChange = (delta: number) => {
    if (!selectedProduct) {
      setQuantity((prev) => Math.max(1, prev + delta));
      return;
    }

    const availableQuantity = selectedProduct.todayMenuQuantity;

    setQuantity((prev) => {
      const nextQuantity = Math.max(1, prev + delta);

      if (availableQuantity !== undefined) {
        return Math.min(nextQuantity, Math.max(1, availableQuantity));
      }

      return nextQuantity;
    });
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleOpenOrderDetails = () => {
    if (cartItems.length === 0) {
      setError(
        "Please add at least one product to the cart before placing an order."
      );
      return;
    }

    const invalidCartItem = cartItems.find((cartItem) => {
      const availableQuantity = getAvailableQuantityForProduct(
        cartItem.productId
      );

      return (
        availableQuantity !== undefined && cartItem.quantity > availableQuantity
      );
    });

    if (invalidCartItem) {
      setError(
        `${invalidCartItem.name} quantity is higher than today's menu balance. Please update the cart.`
      );
      return;
    }

    setError("");
    setIsOrderDetailsOpen(true);
  };

  const handleSubmitOrder = async () => {
    try {
      setSubmittingOrder(true);
      setError("");

      const createdOrder = await createOrder({
        ageGroup: orderForm.ageGroup,
        groupSize: Number(orderForm.groupSize) || 1,
        weather: orderForm.weather,
        dayType: orderForm.dayType,
        paymentMethod: "Cashier",
        items: cartItems.map((item) => ({
          productId: item.productId,
          productName: item.name,
          categoryName: item.categoryName,
          image: item.image,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });

      setOrderId(createdOrder.orderNumber);
      setCartItems([]);
      setIsOrderDetailsOpen(false);
      setIsOrderPopupOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleOrderPopupClose = () => {
    setIsOrderPopupOpen(false);

    // This redirects to http://localhost:3000/ in local development.
    router.replace("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="bg-bg-2 px-6 py-4 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-6">
          <h1 className="text-3xl font-bold leading-tight shrink-0">
            <span className="text-primary">NILMINI</span>
            <br />
            <span className="text-secondary">HOTEL</span>
          </h1>

          <div className="hidden md:flex items-center justify-between w-[360px] lg:w-[420px] h-[72px] rounded-xl px-5 bg-gradient-to-r from-bg-1 to-button border border-primary/20 shadow-lg overflow-hidden">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-primary font-bold">
                Today’s Menu
              </p>
              <p className="text-sm font-semibold text-text-white">
                Fresh meals. Fast pickup.
              </p>
              <p className="text-xs text-gray-400">
                Order now and pay at cashier
              </p>
            </div>

            <div className="bg-primary text-text-black rounded-lg px-3 py-2 text-center">
              <p className="text-[10px] font-bold uppercase">Live</p>
              <p className="text-sm font-extrabold">Stock</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <nav className="w-64 bg-bg-2 px-5 py-6 space-y-4 z-40 border-r border-gray-800 overflow-y-auto">
          {allCategories.map((cat) => {
            const Icon = iconMap[cat.icon || "Grid3x3"] || Grid3x3;
            const isActive = selectedCategory === cat.name;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.name)}
                className={`w-full flex items-center justify-between gap-4 px-4 py-3 rounded-lg transition text-left ${
                  isActive
                    ? "bg-primary text-text-black font-semibold"
                    : "hover:bg-button text-gray-400"
                }`}
              >
                <div className="flex items-center gap-4">
                  <Icon size={18} />
                  <span className="text-sm">{cat.name}</span>
                </div>

                <span className="text-xs opacity-80">{cat.count}</span>
              </button>
            );
          })}
        </nav>

        <main className="flex-1 px-8 pt-6 pb-32 overflow-y-auto bg-[#1a1926]">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-2xl font-semibold text-text-white">
                  {selectedCategory === "All" ? "Our Menu" : selectedCategory}
                </h2>

                <p className="text-sm text-gray-400 mt-1">
                  {loading
                    ? "Loading products..."
                    : `${filteredProducts.length} items available`}
                </p>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="bg-[#2b2940] rounded-xl p-3 border border-gray-700/50 animate-pulse"
                  >
                    <div className="w-full aspect-square rounded-lg bg-[#3a3752]" />
                    <div className="mt-3 h-4 rounded bg-[#3a3752]" />
                    <div className="mt-2 h-4 w-20 rounded bg-[#3a3752]" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-[#2b2940] border border-gray-700/50 rounded-2xl p-10 text-center">
                <p className="text-lg font-semibold text-text-white">
                  No products found
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  There are no products in this category right now.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredProducts.map((product) => {
                  const productPrice = toNumber(product.price);
                  const imageSrc = getImageSrc(product.image);
                  const displayAvailability =
                    product.todayMenuQuantity === 0
                      ? "Out of Stock"
                      : product.availability;

                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        setSelectedProduct(product);
                        setQuantity(1);
                        setIsModalOpen(true);
                      }}
                      className="bg-[#2b2940] rounded-xl p-3 flex flex-col items-center gap-3
                      shadow-lg hover:shadow-primary/10 hover:scale-[1.02]
                      transition active:scale-[0.98] border border-gray-700/50 text-left"
                    >
                      <div className="w-full aspect-square rounded-lg overflow-hidden bg-bg-1 flex items-center justify-center">
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <span className="text-xs text-gray-500">
                            No Image
                          </span>
                        )}
                      </div>

                      <div className="w-full text-center pb-2">
                        <h3 className="text-lg font-medium text-text-white truncate w-full">
                          {product.name}
                        </h3>

                        <p className="text-xs text-gray-400 truncate mt-1">
                          {product.categoryName}
                        </p>

                        <p className="text-primary font-bold mt-2">
                          LKR {productPrice.toFixed(0)}
                        </p>

                        {product.todayMenuQuantity !== undefined && (
                          <p className="text-xs text-gray-400 mt-2">
                            Today balance: {product.todayMenuQuantity}
                          </p>
                        )}

                        <p
                          className={`text-xs mt-2 font-medium ${
                            displayAvailability === "In Stock"
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {displayAvailability}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      <footer
        className="fixed bottom-0 left-0 md:left-64 w-full md:w-[calc(100%-16rem)] bg-bg-2 px-6 md:px-8 py-3
        flex justify-between items-center border-t border-gray-700 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.4)]"
      >
        <div className="flex items-center gap-6">
          <div className="relative bg-button p-2 rounded-full">
            <ShoppingCartIcon size={28} className="text-primary" />
            <span
              className="absolute -top-1 -right-1 bg-red-600 text-white
              text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
            >
              {cartCount}
            </span>
          </div>

          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider">
              Total Amount
            </p>
            <p className="text-xl font-bold text-primary">
              LKR {cartTotal.toFixed(2)}
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenOrderDetails}
          disabled={cartItems.length === 0}
          className={`font-extrabold py-3 px-8 md:px-12 rounded-xl text-sm md:text-lg transition-all transform active:scale-95 ${
            cartItems.length === 0
              ? "bg-gray-600 text-gray-300 cursor-not-allowed"
              : "bg-primary hover:bg-yellow-400 text-black hover:scale-105"
          }`}
          type="button"
        >
          Place My Order
        </button>
      </footer>

      <SingleProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productName={selectedProduct?.name || ""}
        price={toNumber(selectedProduct?.price)}
        quantity={quantity}
        productImage={getImageSrc(selectedProduct?.image)}
        description={selectedProduct?.description || ""}
        ingredients={getProductIngredients(selectedProduct)}
        availability={
          selectedProduct?.todayMenuQuantity === 0
            ? "Out of Stock"
            : selectedProduct?.availability
        }
        onQuantityChange={handleQuantityChange}
        onAddToCart={handleAddToCart}
      />

      {isOrderDetailsOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="relative bg-bg-2 rounded-3xl p-8 w-[95%] max-w-2xl shadow-2xl border border-primary/20">
            <h2 className="text-2xl font-bold text-text-white mb-2">
              Confirm Your Order
            </h2>

            <p className="text-sm text-gray-400 mb-6">
              Please check the selected products before placing the order.
            </p>

            <div className="bg-[#1a1926] border border-gray-700 rounded-2xl p-4 mb-6 max-h-52 overflow-y-auto">
              <div className="flex justify-between text-sm font-semibold text-gray-300 mb-3">
                <span>Cart Items</span>
                <span>LKR {cartTotal.toFixed(2)}</span>
              </div>

              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <div>
                      <p className="text-text-white font-medium">
                        {item.name} × {item.quantity}
                      </p>
                      <p className="text-xs text-gray-400">
                        LKR {item.unitPrice.toFixed(2)} each
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-primary font-semibold">
                        LKR {item.lineTotal.toFixed(2)}
                      </span>

                      <button
                        onClick={() => handleRemoveCartItem(item.productId)}
                        className="text-red-400 hover:text-red-300"
                        type="button"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsOrderDetailsOpen(false)}
                className="px-6 py-3 rounded-xl text-gray-300 hover:text-white"
                type="button"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmitOrder}
                disabled={submittingOrder || cartItems.length === 0}
                className="bg-primary hover:bg-yellow-400 text-black font-bold px-8 py-3 rounded-xl transition disabled:bg-gray-600 disabled:text-gray-300"
                type="button"
              >
                {submittingOrder ? "Placing..." : "Confirm Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isOrderPopupOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div
            className="relative bg-bg-2 rounded-3xl p-10 w-[90%] max-w-md
            text-center shadow-2xl border border-primary/20"
          >
            <div className="absolute top-4 right-6 text-sm font-mono text-primary/60">
              {orderId}
            </div>

            <h2 className="text-2xl font-bold text-text-white mb-2">
              Order Placed!
            </h2>

            <p className="text-gray-400 mb-6 text-sm">
              Please visit the <span className="text-primary">cashier</span> and
              provide your Order ID to complete payment.
            </p>

            <div className="bg-[#1a1926] rounded-2xl py-6 mb-8 border border-gray-700">
              <p className="text-xs text-gray-500 uppercase mb-1">
                Your Order ID
              </p>
              <p className="text-4xl font-black text-primary tracking-widest">
                {orderId}
              </p>
            </div>

            <button
              onClick={handleOrderPopupClose}
              className="w-full bg-primary hover:bg-yellow-400 text-black
              font-bold text-lg py-4 rounded-xl transition shadow-lg shadow-primary/10"
              type="button"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
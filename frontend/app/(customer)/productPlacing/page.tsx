"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ShoppingCart as ShoppingCartIcon,
  Grid3x3,
  Pizza,
  Hamburger,
  Drumstick,
  Croissant,
  CupSoda,
  Fish,
  LucideIcon,
} from "lucide-react";
import SingleProductModal from "../SingleProductModal";
import {
  getCategories,
  getProducts,
} from "../../src/lib/api/product.api";
import type { CategoryDto } from "../../../app/src/types/category";
import type { ProductDto } from "../../../app/src/types/product";

const iconMap: Record<string, LucideIcon> = {
  Grid3x3,
  Pizza,
  Hamburger,
  Drumstick,
  Croissant,
  CupSoda,
  Fish,
};

function resolveImage(path?: string) {
  if (!path || !String(path).trim()) return "/EggRot.jpg";
  return path;
}

export default function App() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [cartCount, setCartCount] = useState(1);
  const [cartTotal, setCartTotal] = useState(150.0);
  const [quantity, setQuantity] = useState(1);

  const [selectedProduct, setSelectedProduct] = useState<ProductDto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isOrderPopupOpen, setIsOrderPopupOpen] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [productData, categoryData] = await Promise.all([
        getProducts(),
        getCategories(),
      ]);

      setProducts(productData);
      setCategories(categoryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const allCategories = useMemo(() => {
    return [
      {
        id: "all",
        name: "All",
        description: "All available products",
        count: products.length,
        icon: "Grid3x3",
        image: "",
      },
      ...categories,
    ];
  }, [categories, products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "All") return products;
    return products.filter((item) => item.categoryName === selectedCategory);
  }, [products, selectedCategory]);

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    setCartCount((prev) => prev + quantity);
    setCartTotal((prev) => prev + quantity * selectedProduct.price);
    setQuantity(1);
    setIsModalOpen(false);
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handlePlaceOrder = () => {
    const newOrderId = `ORD-${Date.now().toString().slice(-6)}`;
    setOrderId(newOrderId);
    setIsOrderPopupOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="bg-bg-2 px-6 py-4 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-6">
          <h1 className="text-3xl font-bold leading-tight shrink-0">
            <span className="text-primary">NILMINI</span>
            <br />
            <span className="text-secondary">HOTEL</span>
          </h1>

          {/* Advertisement Banner */}
          <div className="hidden md:flex items-center justify-between w-[360px] lg:w-[420px] h-[72px] rounded-xl px-5 bg-gradient-to-r from-bg-1 to-button border border-primary/20 shadow-lg overflow-hidden">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-primary font-bold">
                Today’s Special
              </p>
              <p className="text-sm font-semibold text-text-white">
                Fresh meals. Fast pickup.
              </p>
              <p className="text-xs text-gray-400">
                Order now and pay at cashier
              </p>
            </div>

            <div className="bg-primary text-text-black rounded-lg px-3 py-2 text-center">
              <p className="text-[10px] font-bold uppercase">Hot</p>
              <p className="text-sm font-extrabold">Menu</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
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

        {/* Product Grid */}
        <main className="flex-1 px-8 pt-6 pb-24 overflow-y-auto bg-[#1a1926]">
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

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
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
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      setSelectedProduct(product);
                      setQuantity(1);
                      setIsModalOpen(true);
                    }}
                    className="bg-[#2b2940] rounded-xl p-3 flex flex-col items-center gap-3
                    shadow-lg hover:shadow-primary/10 hover:scale-[1.02]
                    transition active:scale-[0.98] border border-gray-700/50 text-left"
                  >
                    <div className="w-full aspect-square rounded-lg overflow-hidden bg-bg-1">
                      <img
                        src={resolveImage(product.image)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="w-full text-center pb-2">
                      <h3 className="text-lg font-medium text-text-white truncate w-full">
                        {product.name}
                      </h3>

                      <p className="text-xs text-gray-400 truncate mt-1">
                        {product.categoryName}
                      </p>

                      <p className="text-primary font-bold mt-2">
                        LKR {product.price.toFixed(0)}
                      </p>

                      <p
                        className={`text-xs mt-2 font-medium ${
                          product.availability === "In Stock"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {product.availability}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Bottom Cart */}
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
          onClick={handlePlaceOrder}
          className="bg-primary hover:bg-yellow-400 text-black
          font-extrabold py-3 px-8 md:px-12 rounded-xl text-sm md:text-lg transition-all transform hover:scale-105 active:scale-95"
        >
          Place My Order
        </button>
      </footer>

      {/* Product Modal */}
      <SingleProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productName={selectedProduct?.name || ""}
        price={selectedProduct?.price || 0}
        quantity={quantity}
        onQuantityChange={handleQuantityChange}
        onAddToCart={handleAddToCart}
      />

      {/* Order Success Popup */}
      {isOrderPopupOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div
            className="relative bg-bg-2 rounded-3xl p-10 w-[90%] max-w-md
            text-center shadow-2xl border border-primary/20"
          >
            <div className="absolute top-4 right-6 text-sm font-mono text-primary/60">
              {orderId}
            </div>

            <div className="text-5xl mb-4">✨</div>

            <h2 className="text-2xl font-bold text-text-white mb-2">
              Order Placed!
            </h2>

            <p className="text-gray-400 mb-6 text-sm">
              Please visit the <span className="text-primary">cashier</span> and
              provide your Order ID to complete payment.
            </p>

            <div className="bg-[#1a1926] rounded-2xl py-6 mb-8 border border-gray-700">
              <p className="text-xs text-gray-500 uppercase mb-1">Your Order ID</p>
              <p className="text-4xl font-black text-primary tracking-widest">
                {orderId}
              </p>
            </div>

            <button
              onClick={() => setIsOrderPopupOpen(false)}
              className="w-full bg-primary hover:bg-yellow-400 text-black
              font-bold text-lg py-4 rounded-xl transition shadow-lg shadow-primary/10"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
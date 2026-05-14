/* eslint-disable @next/next/no-img-element */
"use client";

import { X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  price: number;
  quantity: number;
  productImage?: string;
  description?: string;
  ingredients?: string[];
  availability?: string;
  onQuantityChange: (delta: number) => void;
  onAddToCart: () => void;
}

export default function SingleProductModal({
  isOpen,
  onClose,
  productName,
  price,
  quantity,
  productImage,
  description,
  ingredients = [],
  availability,
  onQuantityChange,
  onAddToCart,
}: Props) {
  if (!isOpen) return null;

  const isOutOfStock = Boolean(availability && availability !== "In Stock");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-1/70 backdrop-blur-sm">
      <div className="bg-bg-2 rounded-2xl w-[780px] max-w-[95vw] p-8 relative shadow-2xl border border-gray-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-red-600 hover:scale-110 transition"
          type="button"
        >
          <X size={28} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left side */}
          <div className="flex flex-col">
            <div
              className="rounded-xl overflow-hidden bg-bg-3 h-[240px] mb-6
              shadow-[0_20px_40px_rgba(0,0,0,0.35)]
              hover:shadow-[0_30px_60px_rgba(0,0,0,0.45)]
              transition-shadow duration-300 flex items-center justify-center"
            >
              {productImage ? (
                <img
                  src={productImage}
                  alt={productName}
                  className="w-full h-full object-cover scale-[1.02]"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <span className="text-sm text-gray-500">No Image</span>
              )}
            </div>

            <h2 className="text-3xl font-bold mb-4 text-text-white">
              {productName}
            </h2>

            <p className="text-sm text-muted mb-6">
              {description && description.trim()
                ? description
                : "Freshly prepared at Nilmini Hotel with quality ingredients."}
            </p>

            <div className="mt-auto">
              <div className="flex items-center gap-6">
                <span className="text-xl font-bold text-primary">
                  LKR {Number(price || 0).toFixed(2)}
                </span>

                <div className="flex items-center bg-primary/20 rounded-full overflow-hidden">
                  <button
                    onClick={() => onQuantityChange(-1)}
                    className="px-4 py-2 font-bold hover:bg-primary/30 transition"
                    type="button"
                  >
                    −
                  </button>

                  <span className="px-4 font-semibold">{quantity}</span>

                  <button
                    onClick={() => onQuantityChange(1)}
                    className="px-4 py-2 font-bold hover:bg-primary/30 transition"
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>

              <p
                className={`text-paragraph text-center mt-3 font-medium ${
                  isOutOfStock ? "text-red-400" : "text-green-400"
                }`}
              >
                {availability || "In Stock"}
              </p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex flex-col justify-between">
            <div>
              <h4 className="font-semibold mb-3 text-text-white">
                Ingredients:
              </h4>

              {ingredients.length > 0 ? (
                <ul className="text-sm space-y-1 text-muted">
                  {ingredients.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">
                  Ingredient details are not added for this product.
                </p>
              )}
            </div>

            <div className="flex gap-2 justify-end mt-8">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-full text-muted hover:text-foreground transition"
                type="button"
              >
                Cancel
              </button>

              <button
                onClick={onAddToCart}
                disabled={isOutOfStock}
                className={`font-bold px-8 py-3 rounded-full transition ${
                  isOutOfStock
                    ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                    : "bg-primary hover:bg-secondary text-text-black"
                }`}
                type="button"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
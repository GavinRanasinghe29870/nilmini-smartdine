'use client';

import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  price: number;
  quantity: number;
  onQuantityChange: (delta: number) => void;
  onAddToCart: () => void;
}

export default function SingleProductModal({
  isOpen,
  onClose,
  productName,
  price,
  quantity,
  onQuantityChange,
  onAddToCart,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-1/70">
      {/* Modal */}
      <div className="bg-bg-2 rounded-2xl w-[780px] max-w-[95vw] p-8 relative shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-red-600 hover:scale-110 transition"
        >
          <X size={28} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEFT SIDE */}
          <div className="flex flex-col">
            {/* Image */}
            <div
              className="rounded-xl overflow-hidden bg-bg-3 h-[240px] mb-6
                         shadow-[0_20px_40px_rgba(0,0,0,0.35)]
                         hover:shadow-[0_30px_60px_rgba(0,0,0,0.45)]
                         transition-shadow duration-300"
            >
              <img
                src="/EggRot.jpg"
                alt={productName}
                className="w-full h-full object-cover scale-[1.02]"
              />
            </div>

            {/* Content */}
            <h2 className="text-3xl font-bold mb-4">{productName}</h2>

            <p className="text-sm text-muted mb-6">
              A soft and freshly made rotti folded with a seasoned egg filling,
              cooked to perfection. A simple, flavourful, and satisfying Sri
              Lankan favorite — prepared hot and fresh at Nilmini Hotel.
            </p>
            <div className="mt-auto">
              <div className="flex items-center gap-6">
                {/* Price */}
                <span className="text-xl font-bold text-primary">
                  LKR {price.toFixed(2)}
                </span>

                {/* Quantity */}
                <div className="flex items-center bg-primary/20 rounded-full overflow-hidden">
                  <button
                    onClick={() => onQuantityChange(-1)}
                    className="px-4 py-2 font-bold hover:bg-primary/30 transition"
                  >
                    −
                  </button>

                  <span className="px-4 font-semibold">{quantity}</span>

                  <button
                    onClick={() => onQuantityChange(1)}
                    className="px-4 py-2 font-bold hover:bg-primary/30 transition"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Remaining Items */}
              <p className="text-paragraph text-text-white text-center mt-2 underline">
                200 Remaining Items
              </p>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex flex-col justify-between">
            {/* Ingredients */}
            <div>
              <h4 className="font-semibold mb-3">Ingredients:</h4>
              <ul className="text-sm space-y-1 text-muted">
                <li>Flour: 120g</li>
                <li>Salt: 2g</li>
                <li>Oil: 10ml</li>
                <li>Water: 40ml</li>
                <li>Egg: 1</li>
                <li>Onions: 25g</li>
                <li>Green Chilli: 5g</li>
                <li>Pepper: 1g</li>
                <li>Herbs: 2g</li>
              </ul>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-full text-muted hover:text-foreground transition"
              >
                Cancel
              </button>

              <button
                onClick={onAddToCart}
                className="bg-primary hover:bg-secondary text-text-black font-bold px-8 py-3 rounded-full transition"
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

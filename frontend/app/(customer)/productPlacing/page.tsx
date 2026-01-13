'use client';

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import SingleProductModal from '../SingleProductModal';

export default function App() {
  const [cartCount, setCartCount] = useState(1);
  const [cartTotal, setCartTotal] = useState(150.0);
  const [quantity, setQuantity] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Order popup state
  const [isOrderPopupOpen, setIsOrderPopupOpen] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const categories = [
    { name: 'Home', icon: '🏠', active: false },
    { name: 'Chicken Products', icon: '🍗', active: false },
    { name: 'Fish Products', icon: '🐟', active: false },
    { name: 'Egg Products', icon: '🥚', active: true },
    { name: 'Beverages', icon: '☕', active: false },
    { name: 'Others', icon: '📦', active: false },
  ];

  const eggProducts = Array(6).fill({
    name: 'Egg Rotti',
    price: 150.0,
  });

  const handleAddToCart = () => {
    setCartCount((prev) => prev + quantity);
    setCartTotal((prev) => prev + quantity * 150.0);
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
      <header className="bg-bg-2 pl-6 pr-6 py-1 flex justify-between items-center">
        <h1 className="text-5xl font-bold leading-tight">
          <span className="text-primary">NILMINI</span>
          <br />
          <span className="text-secondary">HOTEL</span>
        </h1>

        <img
          src="/Advertisement.png"
          alt="Advertisement"
          className="w-[1200px] h-[194px] rounded-lg"
        />
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <nav className="w-64 bg-bg-2 px-5 py-6 space-y-4 z-40">
          {categories.map((cat) => (
            <a
              key={cat.name}
              href="#"
              className={`flex items-center gap-4 px-4 py-3 rounded-lg transition ${
                cat.active
                  ? 'bg-primary text-text-black font-semibold'
                  : 'hover:bg-button'
              }`}
            >
              <span className="text-2xl">{cat.icon}</span>
              {cat.name}
            </a>
          ))}
        </nav>

        {/* Product Grid */}
        <main className="flex-1 px-4 pt-8 pb-24 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 max-w-5xl mx-auto px-2">
            {eggProducts.map((product, index) => (
              <button
                key={index}
                onClick={() => {
                  setQuantity(1);
                  setIsModalOpen(true);
                }}
                className="bg-[#2b2940] rounded-2xl p-5 flex flex-col items-center gap-4
                shadow-[0_0_25px_rgba(255,255,255,0.15)]
                hover:shadow-[0_0_35px_rgba(255,255,255,0.25)]
                hover:scale-[1.03] transition active:scale-[0.97]"
              >
                <div className="w-full rounded-xl p-3">
                  <img
                    src="/EggRot.jpg"
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>

                <div className="text-center">
                  <h3 className="text-2xl font-semibold text-text-white">
                    {product.name}
                  </h3>
                  <p className="text-xl mt-1 text-gray-200">
                    LKR {product.price.toFixed(2)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </main>
      </div>

      {/* Bottom Cart */}
      <footer className="fixed bottom-0 left-64 w-[calc(100%-16rem)] bg-bg-2 px-6 py-2
        flex justify-center items-center gap-10 border-t border-gray-700 z-20">
        <div className="flex items-center gap-5">
          <div className="relative">
            <ShoppingCart size={40} />
            <span className="absolute -top-2 -right-2 bg-red-600 text-text-white
              text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center">
              {cartCount}
            </span>
          </div>

          <span className="text-xl font-semibold">
            Total: LKR {cartTotal.toFixed(2)}
          </span>
        </div>

        <button
          onClick={handlePlaceOrder}
          className="bg-primary hover:bg-secondary text-text-black
          font-bold py-3 px-10 rounded-full text-xl transition"
        >
          Place My Order
        </button>
      </footer>

      {/* Product Modal */}
      <SingleProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productName="Egg Rotti"
        price={150.0}
        quantity={quantity}
        onQuantityChange={handleQuantityChange}
        onAddToCart={handleAddToCart}
      />

      {/* Order Success Popup */}
      {isOrderPopupOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="relative bg-bg-2 rounded-3xl p-10 w-[90%] max-w-xl
            text-center shadow-2xl border border-gray-600">

            {/* Order ID */}
            <div className="absolute top-4 right-6 text-lg font-bold text-primary">
              {orderId}
            </div>

            <div className="text-6xl mb-4">✅</div>

            <h2 className="text-3xl font-bold text-text-white mb-4">
              Order Successfully Placed
            </h2>

            <p className="text-xl text-gray-200 mb-6 leading-relaxed">
              Please go to the <span className="text-primary font-semibold">cashier</span> to make the payment.
              <br />
              Tell them your <span className="text-primary font-semibold">Order ID</span>.
            </p>

            <div className="bg-button rounded-2xl py-4 mb-8">
              <p className="text-lg text-gray-300">Your Order ID</p>
              <p className="text-4xl font-extrabold text-text-black tracking-wider">
                {orderId}
              </p>
            </div>

            <button
              onClick={() => setIsOrderPopupOpen(false)}
              className="bg-primary hover:bg-secondary text-text-black
              font-bold text-xl px-12 py-4 rounded-full transition"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

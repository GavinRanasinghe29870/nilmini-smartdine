'use client';

import { useState } from 'react';
import { ShoppingCart as ShoppingCartIcon } from 'lucide-react';
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

  const eggProducts = Array(8).fill({
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
      <header className="bg-bg-2 px-6 py-4 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold leading-tight">
            <span className="text-primary">NILMINI</span>
            <br />
            <span className="text-secondary">HOTEL</span>
          </h1>

          {/* Advertisement image commented out */}
          {/* <img
            src="/Advertisement.png"
            alt="Advertisement"
            className="w-[800px] h-[120px] rounded-lg object-cover"
          /> 
          */}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="w-64 bg-bg-2 px-5 py-6 space-y-4 z-40 border-r border-gray-800 overflow-y-auto">
          {categories.map((cat) => (
            <a
              key={cat.name}
              href="#"
              className={`flex items-center gap-4 px-4 py-3 rounded-lg transition ${
                cat.active
                  ? 'bg-primary text-text-black font-semibold'
                  : 'hover:bg-button text-gray-400'
              }`}
            >
              <span className="text-xl">{cat.icon}</span>
              <span className="text-sm">{cat.name}</span>
            </a>
          ))}
        </nav>

        {/* Product Grid */}
        <main className="flex-1 px-8 pt-8 pb-24 overflow-y-auto bg-[#1a1926]">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-6xl mx-auto">
            {eggProducts.map((product, index) => (
              <button
                key={index}
                onClick={() => {
                  setQuantity(1);
                  setIsModalOpen(true);
                }}
                /* Smaller Card Styling */
                className="bg-[#2b2940] rounded-xl p-3 flex flex-col items-center gap-3
                shadow-lg hover:shadow-primary/10
                hover:scale-[1.02] transition active:scale-[0.98] border border-gray-700/50"
              >
                <div className="w-full aspect-square rounded-lg overflow-hidden">
                  <img
                    src="/EggRot.jpg"
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="text-center pb-2">
                  <h3 className="text-lg font-medium text-text-white truncate w-full">
                    {product.name}
                  </h3>
                  <p className="text-primary font-bold">
                    LKR {product.price.toFixed(0)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </main>
      </div>

      {/* Bottom Cart */}
      <footer className="fixed bottom-0 left-64 w-[calc(100%-16rem)] bg-bg-2 px-8 py-3
        flex justify-between items-center border-t border-gray-700 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-6">
          <div className="relative bg-button p-2 rounded-full">
            <ShoppingCartIcon size={28} className="text-primary" />
            <span className="absolute -top-1 -right-1 bg-red-600 text-white
              text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {cartCount}
            </span>
          </div>

          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider">Total Amount</p>
            <p className="text-xl font-bold text-primary">
              LKR {cartTotal.toFixed(2)}
            </p>
          </div>
        </div>

        <button
          onClick={handlePlaceOrder}
          className="bg-primary hover:bg-yellow-400 text-black
          font-extrabold py-3 px-12 rounded-xl text-lg transition-all transform hover:scale-105 active:scale-95"
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="relative bg-bg-2 rounded-3xl p-10 w-[90%] max-w-md
            text-center shadow-2xl border border-primary/20">

            <div className="absolute top-4 right-6 text-sm font-mono text-primary/60">
              {orderId}
            </div>

            <div className="text-5xl mb-4">✨</div>

            <h2 className="text-2xl font-bold text-text-white mb-2">
              Order Placed!
            </h2>

            <p className="text-gray-400 mb-6 text-sm">
              Please visit the <span className="text-primary">cashier</span> and provide your Order ID to complete payment.
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
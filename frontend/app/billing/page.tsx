"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCcw } from "lucide-react";
import {
  confirmOrderPayment,
  getPendingPaymentOrders,
} from "../src/lib/api/order.api";
import { getImageSrc } from "../src/lib/api/product.api";
import type { OrderDto } from "../src/types/order";

type ActiveField = "payment" | "discount" | "ageGroupSize";

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseMoney(value: string) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function getColomboDateTime(value?: string) {
  const date = value ? new Date(value) : new Date();

  return date.toLocaleString("en-LK", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getDayType() {
  const day = new Date().getDay();
  return day === 0 || day === 6 ? "Holiday" : "Work Day";
}

export default function NilminiHotelPOS() {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");

  const [paymentAmount, setPaymentAmount] = useState("0.00");
  const [discountAmount, setDiscountAmount] = useState("0.00");
  const [ageGroupSize, setAgeGroupSize] = useState("0");

  const [activeField, setActiveField] = useState<ActiveField>("payment");

  const [balance, setBalance] = useState("0.00");

  const [currentTime, setCurrentTime] = useState("");
  const [city] = useState("Colombo");
  const [dayType, setDayType] = useState("Work Day");

  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

  const subTotal = selectedOrder?.totalCost || 0;
  const discount = parseMoney(discountAmount);
  const grandTotal = Math.max(subTotal - discount, 0);
  const paidAmount = parseMoney(paymentAmount);
  const balanceValue = paidAmount - grandTotal;

  async function loadPendingOrders() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const data = await getPendingPaymentOrders();

      setOrders(data);

      setSelectedOrderId((previousId) => {
        if (data.some((order) => order.id === previousId)) {
          return previousId;
        }

        return data[0]?.id || "";
      });
    } catch (err) {
      setOrders([]);
      setSelectedOrderId("");
      setError(
        err instanceof Error ? err.message : "Failed to load pending payments"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPendingOrders();
  }, []);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(getColomboDateTime());

      const day = new Date().getDay();
      setDayType(day === 0 || day === 6 ? "Holiday" : "Work Day");
    };

    updateTime();

    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedOrder) {
      setPaymentAmount("0.00");
      setDiscountAmount("0.00");
      setAgeGroupSize("0");
      setBalance("0.00");
      return;
    }

    setPaymentAmount("0.00");
    setDiscountAmount(Number(selectedOrder.discountAmount || 0).toFixed(2));
    setAgeGroupSize(String(selectedOrder.groupSize || 0));
    setBalance("0.00");
    setActiveField("payment");
    setError("");
    setSuccess("");
  }, [selectedOrder]);

  useEffect(() => {
    setBalance(balanceValue.toFixed(2));
  }, [balanceValue]);

  const handleKeypadPress = (key: string) => {
    const targetValue =
      activeField === "payment"
        ? paymentAmount
        : activeField === "discount"
          ? discountAmount
          : ageGroupSize;

    let newValue =
      targetValue === "0.00" || targetValue === "0" ? "" : targetValue;

    if (key === "C") {
      newValue = activeField === "ageGroupSize" ? "0" : "0.00";
    } else if (key === "ENTER") {
      if (activeField === "ageGroupSize") {
        setAgeGroupSize(newValue || "0");
      } else {
        newValue = parseFloat(newValue || "0").toFixed(2);

        if (activeField === "discount") {
          setDiscountAmount(newValue);
          setActiveField("payment");
        } else {
          setPaymentAmount(newValue);
        }
      }

      return;
    } else {
      if (activeField !== "ageGroupSize") {
        if (key === "." && newValue.includes(".")) return;

        newValue += key;

        if (newValue.includes(".")) {
          const [, decimals] = newValue.split(".");
          if (decimals.length > 2) return;
        }
      } else {
        if (key === ".") return;
        newValue += key;
      }
    }

    if (activeField === "payment") {
      setPaymentAmount(newValue);
    } else if (activeField === "discount") {
      setDiscountAmount(newValue);
    } else {
      setAgeGroupSize(newValue);
    }
  };

  async function handleConfirmPayment() {
    if (!selectedOrder) {
      setError("Please select an order first");
      return;
    }

    if (discount > subTotal) {
      setError("Discount cannot be greater than sub total");
      return;
    }

    if (paidAmount < grandTotal) {
      setError("Payment amount is less than grand total");
      return;
    }

    try {
      setConfirming(true);
      setError("");
      setSuccess("");

      const paidOrder = await confirmOrderPayment(selectedOrder.id, {
        paidAmount,
        discountAmount: discount,
        paymentMethod: "Cashier",
        note: selectedOrder.note || "",
      });

      setSuccess(`Payment confirmed for ${paidOrder.orderNumber}`);

      const remainingOrders = orders.filter(
        (order) => order.id !== selectedOrder.id
      );

      setOrders(remainingOrders);
      setSelectedOrderId(remainingOrders[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm payment");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="bg-bg-1 text-foreground font-poppins min-h-screen flex flex-col items-center p-8 gap-6">
      <h1 className="text-big-heading text-3d-purple font-bold text-center">
        NILMINI <span className="text-secondary">HOTEL</span>
      </h1>

      {/* Order Info Bar */}
      <div className="w-full max-w-4xl bg-bg-2 rounded-lg p-4 flex flex-wrap justify-between gap-2 text-paragraph">
        <span>{currentTime}</span>
        <span>City: {city}</span>
        <span>Weather: {selectedOrder?.weather || "Normal"}</span>
        <span>{selectedOrder?.dayType || dayType || getDayType()}</span>
        <span className="font-semibold text-primary">
          Order #: {selectedOrder?.orderNumber || "No pending order"}
        </span>

        <button
          type="button"
          onClick={loadPendingOrders}
          className="flex items-center gap-2 px-3 py-1 rounded-lg bg-bg-1 hover:bg-black/40 text-sm"
        >
          <RefreshCcw size={14} />
          Refresh
        </button>
      </div>

      {/* Pending order selector */}
      <div className="w-full max-w-4xl bg-bg-2 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Recent Orders Awaiting Payment
          </h2>
          <p className="text-sm text-gray-400">
            Select the order using Order ID before confirming payment.
          </p>
        </div>

        <select
          value={selectedOrderId}
          onChange={(e) => setSelectedOrderId(e.target.value)}
          disabled={loading || orders.length === 0}
          className="bg-bg-1 border border-white/10 rounded-lg px-4 py-2 text-white outline-none min-w-[260px]"
        >
          {orders.length === 0 ? (
            <option value="">No pending payment orders</option>
          ) : (
            orders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.orderNumber} - LKR {formatMoney(order.totalCost)}
              </option>
            ))
          )}
        </select>
      </div>

      {error && (
        <div className="w-full max-w-4xl bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {success && (
        <div className="w-full max-w-4xl bg-green-500/10 border border-green-500/30 text-green-300 rounded-lg px-4 py-3">
          {success}
        </div>
      )}

      {loading ? (
        <div className="w-full max-w-4xl bg-bg-2 rounded-lg p-10 text-center">
          <p className="text-gray-400">Loading pending payment orders...</p>
        </div>
      ) : !selectedOrder ? (
        <div className="w-full max-w-4xl bg-bg-2 rounded-lg p-10 text-center">
          <p className="text-xl font-semibold text-white">
            No pending payments
          </p>
          <p className="text-gray-400 mt-2">
            Orders placed from the product placing page will appear here until
            payment is confirmed.
          </p>
        </div>
      ) : (
        <div className="w-full max-w-4xl flex flex-col md:flex-row gap-6">
          {/* LEFT */}
          <div className="flex-1 bg-bg-2 rounded-lg p-4 flex flex-col gap-4">
            <table className="w-full border-separate border-spacing-y-2 text-lg">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Each(LKR)</th>
                  <th>Total(LKR)</th>
                </tr>
              </thead>

              <tbody>
                {selectedOrder.items.map((item, index) => (
                  <tr key={`${item.productId}-${index}`} className="bg-bg-1">
                    <td className="flex items-center gap-2 p-2">
                      <img
                        src={getImageSrc(item.image, "/AddImage.png")}
                        alt={item.productName}
                        className="w-12 h-12 object-cover rounded border border-white/10"
                        onError={(event) => {
                          event.currentTarget.src = "/AddImage.png";
                        }}
                      />

                      <div>
                        <p className="text-white">{item.productName}</p>
                        {item.categoryName && (
                          <p className="text-xs text-gray-400">
                            {item.categoryName}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="text-center">{item.quantity}</td>
                    <td className="text-center">
                      {formatMoney(item.unitPrice)}
                    </td>
                    <td className="text-center">
                      {formatMoney(item.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="bg-primary rounded-lg p-4 flex flex-col gap-3 text-black">
              <div className="flex justify-between">
                <span>Sub Total</span>
                <span>{formatMoney(subTotal)}</span>
              </div>

              {/* Discount */}
              <SelectableRow
                label="Discount (LKR)"
                value={discountAmount || "0.00"}
                active={activeField === "discount"}
                onClick={() => setActiveField("discount")}
              />

              <div className="flex justify-between font-semibold">
                <span>Grand Total</span>
                <span>{formatMoney(grandTotal)}</span>
              </div>

              {/* Payment */}
              <SelectableRow
                label="Payment Amount (LKR)"
                value={paymentAmount || "0.00"}
                active={activeField === "payment"}
                onClick={() => setActiveField("payment")}
              />

              <div className="flex justify-between">
                <span>Balance</span>
                <span>{formatMoney(parseMoney(balance))}</span>
              </div>

              {/* Age Group */}
              <div className="flex justify-between">
                <span>Customer Age Group</span>
                <span className="font-semibold">
                  {selectedOrder.ageGroup || "Not Provided"}
                </span>
              </div>

              {/* Age Group Size */}
              <SelectableRow
                label="Customer Age Group Size"
                value={ageGroupSize}
                active={activeField === "ageGroupSize"}
                onClick={() => setActiveField("ageGroupSize")}
              />

              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={confirming}
                className="bg-button text-white py-2 rounded disabled:opacity-60"
              >
                {confirming ? "Confirming..." : "Confirm Payment"}
              </button>
            </div>
          </div>

          {/* RIGHT KEYPAD */}
          <div className="w-full md:w-64 flex flex-col gap-4">
            <input
              readOnly
              value={
                activeField === "payment"
                  ? paymentAmount
                  : activeField === "discount"
                    ? discountAmount
                    : ageGroupSize
              }
              className="bg-bg-2 p-3 text-center font-bold text-xl"
            />

            <div className="grid grid-cols-3 gap-2">
              {["7", "8", "9", "4", "5", "6", "1", "2", "3", "C", "0", "."].map(
                (key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleKeypadPress(key)}
                    className="bg-primary py-4 text-black font-semibold rounded"
                  >
                    {key}
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              onClick={() => handleKeypadPress("ENTER")}
              className="bg-secondary py-4 font-bold text-black rounded"
            >
              ENTER
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* Reusable Selectable Row */
function SelectableRow({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex justify-between p-2 cursor-pointer rounded ${
        active ? "bg-secondary/40 border-2 border-secondary" : "bg-bg-2"
      }`}
    >
      <span>{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
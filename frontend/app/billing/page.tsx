/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import { LogOut, RefreshCcw, Trash2 } from "lucide-react";
import {
  confirmOrderPayment,
  deleteOrder,
  getPendingPaymentOrders,
  updateOrder,
} from "../src/lib/api/order.api";
import { getImageSrc } from "../src/lib/api/product.api";
import { logout, verify } from "../src/lib/auth";
import type { DayType, OrderDto, OrderItemDto } from "../src/types/order";

type ActiveField = "payment" | "discount" | "groupSize";

const CUSTOMER_GROUP_OPTIONS = [
  "School Children",
  "Youngers",
  "Younger Adults",
  "Elders",
];

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

function getAutomaticDayType(): DayType {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Colombo",
    weekday: "short",
  }).format(new Date());

  return weekday === "Sat" || weekday === "Sun" ? "Holiday" : "Work Day";
}

function normalizeCustomerGroup(value?: string) {
  const cleanValue = String(value || "").trim();

  if (CUSTOMER_GROUP_OPTIONS.includes(cleanValue)) {
    return cleanValue;
  }

  if (cleanValue === "Children") {
    return "School Children";
  }

  if (cleanValue === "Teenagers" || cleanValue === "Young People") {
    return "Youngers";
  }

  if (cleanValue === "Young Adults" || cleanValue === "Adults") {
    return "Younger Adults";
  }

  return "Younger Adults";
}

function buildPendingOrdersSignature(data: OrderDto[]) {
  return data
    .map((order) => {
      const extra = order as OrderDto & {
        updatedAt?: string;
        status?: string;
        paymentStatus?: string;
      };

      return [
        order.id,
        order.orderNumber,
        order.totalCost,
        order.items?.length || 0,
        extra.updatedAt || "",
        extra.status || "",
        extra.paymentStatus || "",
      ].join(":");
    })
    .join("|");
}

function mapWeatherCodeToWeatherType(code: number): string {
  if (code === 0) {
    return "Sunny";
  }

  if ([1, 2, 3, 45, 48].includes(code)) {
    return "Cloudy";
  }

  if (
    [
      51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85,
      86, 95, 96, 99,
    ].includes(code)
  ) {
    return "Rainy";
  }

  return "Normal";
}

async function fetchMataraWeatherType() {
  try {
    const response = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=5.9485&longitude=80.5353&current=weather_code&timezone=Asia%2FColombo",
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return "Normal";
    }

    const data = await response.json();

    const weatherCode =
      data?.current?.weather_code ?? data?.current_weather?.weathercode;

    if (typeof weatherCode !== "number") {
      return "Normal";
    }

    return mapWeatherCodeToWeatherType(weatherCode);
  } catch {
    return "Normal";
  }
}

export default function NilminiHotelPOS() {
  const router = useRouter();

  const pendingOrdersSignatureRef = useRef("");
  const lastAppliedSelectedOrderIdRef = useRef("");

  const [accessChecking, setAccessChecking] = useState(true);
  const [accessAllowed, setAccessAllowed] = useState(false);
  const [cashierName, setCashierName] = useState("Cashier");

  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");

  const [paymentAmount, setPaymentAmount] = useState("0.00");
  const [discountAmount, setDiscountAmount] = useState("0.00");
  const [groupSize, setGroupSize] = useState("0");

  const [ageGroup, setAgeGroup] = useState("Younger Adults");
  const [activeField, setActiveField] = useState<ActiveField>("payment");

  const [balance, setBalance] = useState("0.00");

  const [currentTime, setCurrentTime] = useState("");
  const [city] = useState("Matara");
  const [weather, setWeather] = useState("Normal");
  const [dayType, setDayType] = useState<DayType>(getAutomaticDayType());
  const [weatherLoading, setWeatherLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedOrder = useMemo<OrderDto | null>(
    () =>
      orders.find((order: OrderDto) => order.id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

  const subTotal = selectedOrder?.totalCost || 0;
  const discount = parseMoney(discountAmount);
  const grandTotal = Math.max(subTotal - discount, 0);
  const paidAmount = parseMoney(paymentAmount);
  const balanceValue = paidAmount - grandTotal;

  async function loadPendingOrders(options?: {
    silent?: boolean;
    updateOnlyWhenChanged?: boolean;
  }) {
    const silent = Boolean(options?.silent);
    const updateOnlyWhenChanged = Boolean(options?.updateOnlyWhenChanged);

    try {
      if (!silent) {
        setLoading(true);
        setError("");
        setSuccess("");
      }

      const data: OrderDto[] = await getPendingPaymentOrders();
      const newSignature = buildPendingOrdersSignature(data);

      if (
        updateOnlyWhenChanged &&
        newSignature === pendingOrdersSignatureRef.current
      ) {
        return;
      }

      pendingOrdersSignatureRef.current = newSignature;

      setOrders(data);

      setSelectedOrderId((previousId: string) => {
        if (data.some((order: OrderDto) => order.id === previousId)) {
          return previousId;
        }

        return data[0]?.id || "";
      });
    } catch (err) {
      if (!silent) {
        setOrders([]);
        setSelectedOrderId("");
        pendingOrdersSignatureRef.current = "";

        setError(
          err instanceof Error ? err.message : "Failed to load pending payments"
        );
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  async function loadWeatherType() {
    try {
      setWeatherLoading(true);

      const weatherType = await fetchMataraWeatherType();

      setWeather(weatherType);
    } finally {
      setWeatherLoading(false);
    }
  }

  async function handleLogout() {
    if (loggingOut) return;

    const confirmed = window.confirm("Are you sure you want to logout?");

    if (!confirmed) return;

    try {
      setLoggingOut(true);
      setError("");
      setSuccess("");

      await logout();

      router.replace("/login");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed");
    } finally {
      setLoggingOut(false);
    }
  }

  useEffect(() => {
    async function checkCashierAccess() {
      try {
        setAccessChecking(true);

        const data = await verify();
        const role = data?.user?.role;

        if (role !== "CASHIER") {
          router.replace("/login");
          return;
        }

        setCashierName(
          data.user.fullName ||
            data.user.username ||
            data.user.email ||
            "Cashier"
        );

        setAccessAllowed(true);
      } catch {
        router.replace("/login");
      } finally {
        setAccessChecking(false);
      }
    }

    checkCashierAccess();
  }, [router]);

  useEffect(() => {
    if (!accessAllowed) return;

    loadPendingOrders();
  }, [accessAllowed]);

  useEffect(() => {
    if (!accessAllowed) return;

    const interval = setInterval(() => {
      loadPendingOrders({
        silent: true,
        updateOnlyWhenChanged: true,
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [accessAllowed]);

  useEffect(() => {
    if (!accessAllowed) return;

    const updateDateTimeAndDayType = () => {
      setCurrentTime(getColomboDateTime());
      setDayType(getAutomaticDayType());
    };

    updateDateTimeAndDayType();

    const interval = setInterval(updateDateTimeAndDayType, 1000);

    return () => clearInterval(interval);
  }, [accessAllowed]);

  useEffect(() => {
    if (!accessAllowed) return;

    loadWeatherType();

    const interval = setInterval(loadWeatherType, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [accessAllowed]);

  useEffect(() => {
    if (!selectedOrder) {
      if (lastAppliedSelectedOrderIdRef.current === "") return;

      lastAppliedSelectedOrderIdRef.current = "";
      setPaymentAmount("0.00");
      setDiscountAmount("0.00");
      setGroupSize("0");
      setAgeGroup("Younger Adults");
      setBalance("0.00");
      return;
    }

    if (lastAppliedSelectedOrderIdRef.current === selectedOrder.id) {
      return;
    }

    lastAppliedSelectedOrderIdRef.current = selectedOrder.id;

    setPaymentAmount("0.00");
    setDiscountAmount(Number(selectedOrder.discountAmount || 0).toFixed(2));
    setGroupSize(String(selectedOrder.groupSize ?? 0));
    setAgeGroup(normalizeCustomerGroup(selectedOrder.ageGroup));

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
          : groupSize;

    let newValue =
      targetValue === "0.00" || targetValue === "0" ? "" : targetValue;

    if (key === "C") {
      newValue = activeField === "groupSize" ? "0" : "0.00";
    } else if (key === "ENTER") {
      if (activeField === "groupSize") {
        const safeGroupSize = Math.max(0, Number(newValue || 0));
        setGroupSize(String(Math.floor(safeGroupSize)));
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
      if (activeField !== "groupSize") {
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
      setGroupSize(newValue || "0");
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

    const cleanGroupSize = Math.max(0, Math.floor(Number(groupSize) || 0));

    try {
      setConfirming(true);
      setError("");
      setSuccess("");

      await updateOrder(selectedOrder.id, {
        ageGroup,
        groupSize: cleanGroupSize,
        weather,
        dayType,
      });

      const paidOrder = await confirmOrderPayment(selectedOrder.id, {
        paidAmount,
        discountAmount: discount,
        paymentMethod: "Cashier",
        note: selectedOrder.note || "",
      });

      setSuccess(`Payment confirmed for ${paidOrder.orderNumber}`);

      const remainingOrders = orders.filter(
        (order: OrderDto) => order.id !== selectedOrder.id
      );

      pendingOrdersSignatureRef.current =
        buildPendingOrdersSignature(remainingOrders);

      setOrders(remainingOrders);
      setSelectedOrderId(remainingOrders[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm payment");
    } finally {
      setConfirming(false);
    }
  }

  async function handleCancelOrder() {
    if (!selectedOrder) {
      setError("Please select an order first");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to cancel ${selectedOrder.orderNumber}?`
    );

    if (!confirmed) return;

    try {
      setCancelling(true);
      setError("");
      setSuccess("");

      await deleteOrder(selectedOrder.id);

      setSuccess(`Order ${selectedOrder.orderNumber} cancelled successfully`);

      const remainingOrders = orders.filter(
        (order: OrderDto) => order.id !== selectedOrder.id
      );

      pendingOrdersSignatureRef.current =
        buildPendingOrdersSignature(remainingOrders);

      setOrders(remainingOrders);
      setSelectedOrderId(remainingOrders[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  }

  if (accessChecking) {
    return (
      <div className="bg-bg-1 text-foreground font-poppins min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Checking cashier access...</p>
      </div>
    );
  }

  if (!accessAllowed) {
    return null;
  }

  return (
    <div className="relative bg-bg-1 text-foreground font-poppins min-h-screen flex flex-col items-center p-8 gap-6">
      <div className="fixed top-5 right-8 z-50 flex items-center gap-3 rounded-xl border border-white/10 bg-bg-2/95 px-4 py-3 shadow-xl backdrop-blur">
        <div className="text-right">
          <p className="text-xs text-gray-400">Welcome</p>
          <p className="text-sm font-semibold text-white">{cashierName}</p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut size={16} />
          {loggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>

      <h1 className="text-big-heading text-3d-purple font-bold text-center">
        NILMINI <span className="text-secondary">HOTEL</span>
      </h1>

      <div className="w-full max-w-4xl bg-bg-2 rounded-lg p-4 flex flex-wrap justify-between gap-2 text-paragraph">
        <span>{currentTime}</span>
        <span>City: {city}</span>
        <span>Weather: {weatherLoading ? "Checking..." : weather}</span>
        <span>{dayType}</span>
        <span className="font-semibold text-primary">
          Order #: {selectedOrder?.orderNumber || "No pending order"}
        </span>

        <button
          type="button"
          onClick={() => {
            loadPendingOrders();
            loadWeatherType();
            setDayType(getAutomaticDayType());
          }}
          className="flex items-center gap-2 px-3 py-1 rounded-lg bg-bg-1 hover:bg-black/40 text-sm"
        >
          <RefreshCcw size={14} />
          Refresh
        </button>
      </div>

      <div className="w-full max-w-4xl bg-bg-2 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Recent Orders Awaiting Payment
          </h2>
          <p className="text-sm text-gray-400">
            New unpaid orders will appear automatically when they are available.
          </p>
        </div>

        <select
          value={selectedOrderId}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            setSelectedOrderId(event.target.value)
          }
          disabled={loading || orders.length === 0}
          className="bg-bg-1 border border-white/10 rounded-lg px-4 py-2 text-white outline-none min-w-[260px]"
        >
          {orders.length === 0 ? (
            <option value="">No pending payment orders</option>
          ) : (
            orders.map((order: OrderDto) => (
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
                {selectedOrder.items.map(
                  (item: OrderItemDto, index: number) => (
                    <tr
                      key={`${item.productId}-${index}`}
                      className="bg-bg-1"
                    >
                      <td className="flex items-center gap-2 p-2">
                        <img
                          src={getImageSrc(item.image, "/AddImage.png")}
                          alt={item.productName}
                          className="w-12 h-12 object-cover rounded border border-white/10"
                          onError={(
                            event: SyntheticEvent<HTMLImageElement>
                          ) => {
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
                  )
                )}
              </tbody>
            </table>

            <div className="bg-primary rounded-lg p-4 flex flex-col gap-3 text-black">
              <div className="flex justify-between">
                <span>Sub Total</span>
                <span>{formatMoney(subTotal)}</span>
              </div>

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

              <div className="flex justify-between items-center gap-3">
                <span>Customer Age Group</span>

                <select
                  value={ageGroup}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    setAgeGroup(event.target.value)
                  }
                  className="bg-gray-700 text-gray-100 rounded px-3 py-2 outline-none border border-gray-500/40"
                >
                  {CUSTOMER_GROUP_OPTIONS.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>

              <SelectableRow
                label="Customer Age Group Size"
                value={groupSize || "0"}
                active={activeField === "groupSize"}
                onClick={() => setActiveField("groupSize")}
              />

              <div className="flex justify-between text-sm">
                <span>Auto Weather Type</span>
                <span className="font-semibold">
                  {weatherLoading ? "Checking..." : weather}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Auto Day Type</span>
                <span className="font-semibold">{dayType}</span>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancelOrder}
                  disabled={cancelling || confirming}
                  className="flex items-center justify-center gap-2 flex-1 bg-red-600 text-white py-2 rounded disabled:opacity-60"
                >
                  <Trash2 size={16} />
                  {cancelling ? "Cancelling..." : "Cancel Order"}
                </button>

                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={confirming || cancelling}
                  className="flex-1 bg-button text-white py-2 rounded disabled:opacity-60"
                >
                  {confirming ? "Confirming..." : "Confirm Payment"}
                </button>
              </div>
            </div>
          </div>

          <div className="w-full md:w-64 flex flex-col gap-4">
            <input
              readOnly
              value={
                activeField === "payment"
                  ? paymentAmount
                  : activeField === "discount"
                    ? discountAmount
                    : groupSize || "0"
              }
              className="bg-gray-700 text-gray-100 border border-gray-500/40 rounded-lg p-3 text-center font-bold text-xl"
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
      className={`flex justify-between p-2 cursor-pointer rounded border-l-4 transition-colors ${
        active
          ? "bg-gray-600 border-gray-300 text-gray-100"
          : "bg-gray-700/80 border-transparent text-gray-200 hover:bg-gray-600"
      }`}
    >
      <span>{label}</span>
      <span className="font-bold text-gray-50">{value}</span>
    </div>
  );
}
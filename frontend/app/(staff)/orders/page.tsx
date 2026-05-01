"use client";

import { useEffect, useMemo, useState } from "react";
import DataTable, { Column } from "../../src/components/DataTable";
import { ArrowLeft, RefreshCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  deleteOrder,
  getOrders,
  updateOrderStatus,
} from "../../src/lib/api/order.api";
import type {
  OrderDto,
  OrderStatus,
  PaymentStatus,
} from "../../src/types/order";

const TIME_ZONE = "Asia/Colombo";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("en-US", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderManagementPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleOrderStatusChange = async (
    id: string,
    orderStatus: OrderStatus
  ) => {
    try {
      setActionLoadingId(id);
      setError("");

      const updated = await updateOrderStatus(id, { orderStatus });

      setOrders((prev) =>
        prev.map((order) => (order.id === id ? updated : order))
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update order status"
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePaymentStatusChange = async (
    id: string,
    paymentStatus: PaymentStatus
  ) => {
    try {
      setActionLoadingId(id);
      setError("");

      const updated = await updateOrderStatus(id, { paymentStatus });

      setOrders((prev) =>
        prev.map((order) => (order.id === id ? updated : order))
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update payment status"
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this order?"
    );

    if (!confirmed) return;

    try {
      setActionLoadingId(id);
      setError("");

      await deleteOrder(id);

      setOrders((prev) => prev.filter((order) => order.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete order");
    } finally {
      setActionLoadingId(null);
    }
  };

  const columns: Column<OrderDto>[] = useMemo(
    () => [
      {
        key: "orderNumber",
        label: "Order ID",
        render: (row) => (
          <span className="font-semibold text-primary">{row.orderNumber}</span>
        ),
      },
      {
        key: "placedAt",
        label: "Date",
        render: (row) => <span>{formatDate(row.placedAt)}</span>,
      },
      {
        key: "createdAt",
        label: "Time",
        render: (row) => <span>{formatTime(row.placedAt)}</span>,
      },
      {
        key: "ageGroup",
        label: "Age Group",
      },
      {
        key: "groupSize",
        label: "Group Size",
        align: "center",
      },
      {
        key: "items",
        label: "Items",
        render: (row) => (
          <div className="space-y-1">
            {row.items.map((item, index) => (
              <div key={index} className="text-xs text-gray-300">
                {item.productName} × {item.quantity}
              </div>
            ))}
          </div>
        ),
      },
      {
        key: "itemsCost" as keyof OrderDto,
        label: "Item Costs",
        render: (row) => (
          <div className="space-y-1">
            {row.items.map((item, index) => (
              <div key={index} className="text-xs text-gray-400">
                Rs. {item.lineTotal.toFixed(2)}
              </div>
            ))}
          </div>
        ),
      },
      {
        key: "weather",
        label: "Weather",
        align: "center",
      },
      {
        key: "dayType",
        label: "Day Type",
        align: "center",
        render: (row) => (
          <span
            className={`px-3 py-1 rounded-full text-xs ${
              row.dayType === "Holiday"
                ? "bg-secondary text-black"
                : "bg-bg-1 text-white"
            }`}
          >
            {row.dayType}
          </span>
        ),
      },
      {
        key: "paymentStatus",
        label: "Payment",
        align: "center",
        render: (row) => (
          <select
            value={row.paymentStatus}
            disabled={actionLoadingId === row.id}
            onChange={(e) =>
              handlePaymentStatusChange(
                row.id,
                e.target.value as PaymentStatus
              )
            }
            className="bg-bg-1 border border-gray-700 rounded-lg px-2 py-1 text-xs outline-none"
          >
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        ),
      },
      {
        key: "orderStatus",
        label: "Order Status",
        align: "center",
        render: (row) => (
          <select
            value={row.orderStatus}
            disabled={actionLoadingId === row.id}
            onChange={(e) =>
              handleOrderStatusChange(row.id, e.target.value as OrderStatus)
            }
            className="bg-bg-1 border border-gray-700 rounded-lg px-2 py-1 text-xs outline-none"
          >
            <option value="Pending">Pending</option>
            <option value="Preparing">Preparing</option>
            <option value="Ready">Ready</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        ),
      },
      {
        key: "totalCost",
        label: "Order Cost (Rs.)",
        align: "right",
        render: (row) => (
          <span className="font-medium text-primary">
            Rs. {row.totalCost.toFixed(2)}
          </span>
        ),
      },
      {
        key: "actions" as keyof OrderDto,
        label: "Actions",
        align: "center",
        render: (row) => (
          <button
            onClick={() => handleDeleteOrder(row.id)}
            disabled={actionLoadingId === row.id}
            className="text-red-400 hover:text-red-300 disabled:opacity-50"
            type="button"
          >
            <Trash2 size={16} />
          </button>
        ),
      },
    ],
    [actionLoadingId]
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full bg-bg-2 hover:bg-bg-1"
          type="button"
        >
          <ArrowLeft size={18} />
        </button>

        <h1 className="text-h4 font-semibold">Order Management</h1>
      </div>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-h5 font-medium">
            Orders <span className="text-gray-400">({orders.length})</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Track orders, customer behavior, and environmental factors
          </p>
        </div>

        <button
          onClick={loadOrders}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-2 hover:bg-bg-1 text-sm"
          type="button"
        >
          <RefreshCcw size={15} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-bg-2 rounded-2xl p-10 text-center border border-gray-700">
          <p className="text-gray-400">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-bg-2 rounded-2xl p-10 text-center border border-gray-700">
          <p className="text-lg font-semibold text-text-white">
            No orders found
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Customer orders will appear here after they place orders.
          </p>
        </div>
      ) : (
        <DataTable columns={columns} data={orders} />
      )}
    </div>
  );
}
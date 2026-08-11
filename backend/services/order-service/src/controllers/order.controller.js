const mongoose = require("mongoose");
const Order = require("../models/Order");
const {
  reduceTodayMenuStockForOrder,
} = require("../services/aiMenuClient.service");

const VALID_ORDER_STATUSES = [
  "Pending",
  "Preparing",
  "Ready",
  "Completed",
  "Cancelled",
];

const VALID_PAYMENT_STATUSES = ["Pending", "Paid", "Cancelled"];

function normalizeMoney(value) {
  const number = Number(value || 0);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Number(number.toFixed(2));
}

function normalizeQuantity(value) {
  const number = Number(value || 0);

  if (!Number.isFinite(number) || number <= 0) {
    return 1;
  }

  return Math.floor(number);
}

function cleanString(value) {
  return String(value || "").trim();
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getColomboDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return {
    year,
    month,
    day,
    dateString: `${year}-${month}-${day}`,
  };
}

function getColomboDateRange(startDate, endDate) {
  const startText = startDate || getColomboDateParts().dateString;
  const endText = endDate || startText;

  return {
    start: new Date(`${startText}T00:00:00.000+05:30`),
    end: new Date(`${endText}T23:59:59.999+05:30`),
  };
}

function serializeOrder(order) {
  return {
    id: String(order._id),
    _id: String(order._id),
    orderNumber: order.orderNumber,

    ageGroup: order.ageGroup,
    groupSize: Number(order.groupSize || 1),
    weather: order.weather,
    dayType: order.dayType,

    items: (order.items || []).map((item) => ({
      productId: item.productId,
      productName: item.productName,
      categoryName: item.categoryName || "",
      image: item.image || "",
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unitPrice || 0),
      lineTotal: Number(item.lineTotal || 0),
    })),

    totalCost: Number(order.totalCost || 0),

    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,

    discountAmount: Number(order.discountAmount || 0),
    paidAmount: Number(order.paidAmount || 0),
    balanceAmount: Number(order.balanceAmount || 0),
    paidAt: order.paidAt || null,

    note: order.note || "",
    placedAt: order.placedAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

function prepareOrderItems(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Order must have at least one item");
  }

  return items.map((item) => {
    const productId = cleanString(item.productId);
    const productName = cleanString(item.productName);
    const quantity = normalizeQuantity(item.quantity);
    const unitPrice = normalizeMoney(item.unitPrice);
    const lineTotal = normalizeMoney(quantity * unitPrice);

    if (!productId) {
      throw new Error("Product ID is required for all order items");
    }

    if (!productName) {
      throw new Error("Product name is required for all order items");
    }

    return {
      productId,
      productName,
      categoryName: cleanString(item.categoryName),
      image: cleanString(item.image),
      quantity,
      unitPrice,
      lineTotal,
    };
  });
}

function calculateTotalCost(items = []) {
  return normalizeMoney(
    items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0)
  );
}

async function generateReadableOrderNumber() {
  const { year, month, day } = getColomboDateParts();
  const shortYear = String(year).slice(-2);
  const datePart = `${shortYear}${month}${day}`;

  const { start, end } = getColomboDateRange(
    `${year}-${month}-${day}`,
    `${year}-${month}-${day}`
  );

  const todayCount = await Order.countDocuments({
    placedAt: {
      $gte: start,
      $lte: end,
    },
  });

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const serial = String(todayCount + attempt + 1).padStart(3, "0");
    const orderNumber = `NM-${datePart}-${serial}`;

    const exists = await Order.exists({ orderNumber });

    if (!exists) {
      return orderNumber;
    }
  }

  const random = Math.floor(1000 + Math.random() * 9000);
  return `NM-${datePart}-${random}`;
}

function buildOrderFilter(query = {}) {
  const filter = {};

  if (query.status) {
    filter.orderStatus = query.status;
  }

  if (query.paymentStatus) {
    filter.paymentStatus = query.paymentStatus;
  }

  if (query.dayType) {
    filter.dayType = query.dayType;
  }

  if (query.startDate || query.endDate) {
    const { start, end } = getColomboDateRange(query.startDate, query.endDate);

    filter.placedAt = {
      $gte: start,
      $lte: end,
    };
  }

  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), "i");

    filter.$or = [
      { orderNumber: regex },
      { ageGroup: regex },
      { weather: regex },
      { "items.productName": regex },
      { "items.categoryName": regex },
    ];
  }

  return filter;
}

async function findOrderByIdOrNumber(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    const order = await Order.findById(id);

    if (order) {
      return order;
    }
  }

  return Order.findOne({ orderNumber: id });
}

exports.createOrder = async (req, res) => {
  try {
    const {
      ageGroup,
      groupSize,
      weather,
      dayType,
      paymentMethod,
      note,
      items,
    } = req.body;

    const preparedItems = prepareOrderItems(items);
    const totalCost = calculateTotalCost(preparedItems);
    const orderNumber = await generateReadableOrderNumber();

    const order = await Order.create({
      orderNumber,

      ageGroup: cleanString(ageGroup) || "Not Provided",
      groupSize: Math.max(1, normalizeQuantity(groupSize || 1)),
      weather: cleanString(weather) || "Normal",
      dayType: dayType === "Holiday" ? "Holiday" : "Work Day",
      paymentMethod: paymentMethod || "Cashier",

      items: preparedItems,
      totalCost,

      discountAmount: 0,
      paidAmount: 0,
      balanceAmount: 0,

      orderStatus: "Pending",
      paymentStatus: "Pending",

      paidAt: null,
      placedAt: new Date(),
      note: cleanString(note),
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: serializeOrder(order),
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to place order",
    });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const filter = buildOrderFilter(req.query);
    const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 200);

    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(limit);

    return res.json({
      success: true,
      count: orders.length,
      data: orders.map(serializeOrder),
    });
  } catch (error) {
    console.error("Get orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await findOrderByIdOrNumber(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.json({
      success: true,
      data: serializeOrder(order),
    });
  } catch (error) {
    console.error("Get order by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const order = await findOrderByIdOrNumber(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "Paid") {
      return res.status(400).json({
        success: false,
        message: "Paid orders cannot be edited",
      });
    }

    const {
      ageGroup,
      groupSize,
      weather,
      dayType,
      paymentMethod,
      note,
      items,
    } = req.body;

    if (ageGroup !== undefined) {
      order.ageGroup = cleanString(ageGroup) || "Not Provided";
    }

    if (groupSize !== undefined) {
      order.groupSize = Math.max(1, normalizeQuantity(groupSize));
    }

    if (weather !== undefined) {
      order.weather = cleanString(weather) || "Normal";
    }

    if (dayType !== undefined) {
      order.dayType = dayType === "Holiday" ? "Holiday" : "Work Day";
    }

    if (paymentMethod !== undefined) {
      order.paymentMethod = paymentMethod || order.paymentMethod;
    }

    if (note !== undefined) {
      order.note = cleanString(note);
    }

    if (items !== undefined) {
      const preparedItems = prepareOrderItems(items);

      order.items = preparedItems;
      order.totalCost = calculateTotalCost(preparedItems);
    }

    await order.save();

    return res.json({
      success: true,
      message: "Order updated successfully",
      data: serializeOrder(order),
    });
  } catch (error) {
    console.error("Update order error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update order",
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await findOrderByIdOrNumber(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const { orderStatus, paymentStatus } = req.body;

    if (orderStatus !== undefined) {
      if (!VALID_ORDER_STATUSES.includes(orderStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order status",
        });
      }

      order.orderStatus = orderStatus;
    }

    if (paymentStatus !== undefined) {
      if (!VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment status",
        });
      }

      order.paymentStatus = paymentStatus;
    }

    await order.save();

    return res.json({
      success: true,
      message: "Order status updated successfully",
      data: serializeOrder(order),
    });
  } catch (error) {
    console.error("Update order status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const { paidAmount, discountAmount, paymentMethod, note } = req.body;

    const order = await findOrderByIdOrNumber(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "Paid") {
      let stockWarning = "";

      try {
        await reduceTodayMenuStockForOrder(order);
      } catch (stockError) {
        console.error("Today Menu stock reduction retry failed:", stockError);

        stockWarning =
          stockError.message || "Today Menu stock reduction failed";
      }

      return res.json({
        success: true,
        message: stockWarning
          ? `Order is already paid, but ${stockWarning}`
          : "Order payment has already been confirmed",
        data: serializeOrder(order),
        stockWarning,
      });
    }

    if (
      order.paymentStatus === "Cancelled" ||
      order.orderStatus === "Cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message: "Cancelled orders cannot be paid",
      });
    }

    const cleanDiscount = normalizeMoney(discountAmount);
    const cleanPaidAmount = normalizeMoney(paidAmount);

    if (cleanDiscount < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid discount amount",
      });
    }

    if (cleanPaidAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid paid amount",
      });
    }

    if (cleanDiscount > Number(order.totalCost || 0)) {
      return res.status(400).json({
        success: false,
        message: "Discount cannot be greater than total cost",
      });
    }

    const grandTotal = normalizeMoney(
      Math.max(Number(order.totalCost || 0) - cleanDiscount, 0)
    );

    if (cleanPaidAmount < grandTotal) {
      return res.status(400).json({
        success: false,
        message: "Payment amount is less than grand total",
      });
    }

    order.discountAmount = cleanDiscount;
    order.paidAmount = cleanPaidAmount;
    order.balanceAmount = normalizeMoney(cleanPaidAmount - grandTotal);
    order.paymentMethod = paymentMethod || "Cashier";
    order.paymentStatus = "Paid";
    order.orderStatus = "Completed";
    order.paidAt = new Date();

    if (note !== undefined) {
      order.note = cleanString(note);
    }

    await order.save();

    let stockWarning = "";

    try {
      await reduceTodayMenuStockForOrder(order);
    } catch (stockError) {
      console.error("Today Menu stock reduction failed:", stockError);

      stockWarning =
        stockError.message || "Today Menu stock reduction failed";
    }

    return res.json({
      success: true,
      message: stockWarning
        ? `Payment confirmed successfully, but ${stockWarning}`
        : "Payment confirmed successfully",
      data: serializeOrder(order),
      stockWarning,
    });
  } catch (error) {
    console.error("Confirm payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to confirm payment",
      error: error.message,
    });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await findOrderByIdOrNumber(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "Paid") {
      return res.status(400).json({
        success: false,
        message: "Paid orders cannot be deleted",
      });
    }

    order.paymentStatus = "Cancelled";
    order.orderStatus = "Cancelled";

    await order.save();
    await Order.findByIdAndDelete(order._id);

    return res.json({
      success: true,
      message: "Order cancelled and deleted successfully",
      data: serializeOrder(order),
    });
  } catch (error) {
    console.error("Delete order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete order",
      error: error.message,
    });
  }
};

exports.getDailySales = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { start, end } = getColomboDateRange(startDate, endDate);

    const orders = await Order.find({
      paymentStatus: "Paid",
      paidAt: {
        $gte: start,
        $lte: end,
      },
    }).sort({ paidAt: 1 });

    const salesMap = new Map();

    for (const order of orders) {
      const orderDate = getColomboDateParts(order.paidAt || order.placedAt)
        .dateString;

      for (const item of order.items || []) {
        const productName = item.productName || "Unknown Product";
        const key = `${orderDate}__${productName}`;

        if (!salesMap.has(key)) {
          salesMap.set(key, {
            date: orderDate,
            productId: item.productId || "",
            productName,
            categoryName: item.categoryName || "",
            totalQuantity: 0,
            totalRevenue: 0,
            orderCount: 0,
          });
        }

        const row = salesMap.get(key);

        row.totalQuantity += Number(item.quantity || 0);
        row.totalRevenue += Number(item.lineTotal || 0);
        row.orderCount += 1;
      }
    }

    const rows = [...salesMap.values()].map((row) => ({
      ...row,
      totalQuantity: normalizeMoney(row.totalQuantity),
      totalRevenue: normalizeMoney(row.totalRevenue),
    }));

    return res.json({
      success: true,
      count: rows.length,
      data: rows,
      dailySales: rows,
      rows,
    });
  } catch (error) {
    console.error("Get daily sales error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch daily sales",
      error: error.message,
    });
  }
};
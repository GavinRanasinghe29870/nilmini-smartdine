const Order = require("../models/Order");

function createOrderNumber() {
  const timePart = Date.now().toString().slice(-6);
  const randomPart = Math.floor(100 + Math.random() * 900);
  return `ORD-${timePart}${randomPart}`;
}

function normalizeMoney(value) {
  const number = Number(value || 0);

  if (!Number.isFinite(number)) return 0;

  return Number(number.toFixed(2));
}

function normalizeOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error("Order items are required");
    error.statusCode = 400;
    throw error;
  }

  return items.map((item) => {
    const productId = String(item.productId || item.id || "").trim();
    const productName = String(item.productName || item.name || "").trim();
    const categoryName = String(item.categoryName || "").trim();
    const image = String(item.image || "").trim();

    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice ?? item.price);

    if (!productId) {
      const error = new Error("Product ID is required for every item");
      error.statusCode = 400;
      throw error;
    }

    if (!productName) {
      const error = new Error("Product name is required for every item");
      error.statusCode = 400;
      throw error;
    }

    if (!Number.isFinite(quantity) || quantity < 1) {
      const error = new Error(`Invalid quantity for ${productName}`);
      error.statusCode = 400;
      throw error;
    }

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      const error = new Error(`Invalid price for ${productName}`);
      error.statusCode = 400;
      throw error;
    }

    const roundedQuantity = Math.floor(quantity);
    const lineTotal = Number((roundedQuantity * unitPrice).toFixed(2));

    return {
      productId,
      productName,
      categoryName,
      image,
      quantity: roundedQuantity,
      unitPrice,
      lineTotal,
    };
  });
}

function getColomboDateString(offsetDays = 0) {
  const now = new Date();
  const targetDate = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(targetDate);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function getColomboDateRange(startDate, endDate) {
  const safeStartDate = startDate || getColomboDateString(0);
  const safeEndDate = endDate || safeStartDate;

  const start = new Date(`${safeStartDate}T00:00:00.000+05:30`);
  const end = new Date(`${safeEndDate}T23:59:59.999+05:30`);

  return {
    start,
    end,
    safeStartDate,
    safeEndDate,
  };
}

exports.createOrder = async (req, res, next) => {
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

    const cleanItems = normalizeOrderItems(items);

    const totalCost = Number(
      cleanItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)
    );

    let orderNumber = createOrderNumber();

    while (await Order.exists({ orderNumber })) {
      orderNumber = createOrderNumber();
    }

    const order = await Order.create({
      orderNumber,
      ageGroup: ageGroup || "Not Provided",
      groupSize: Number(groupSize) > 0 ? Number(groupSize) : 1,
      weather: weather || "Normal",
      dayType: dayType === "Holiday" ? "Holiday" : "Work Day",
      paymentMethod: paymentMethod || "Cashier",
      note: note || "",
      items: cleanItems,
      totalCost,

      // Important: Billing page shows only Pending payments.
      // This does not affect AI menu generation logic.
      paymentStatus: "Pending",
      discountAmount: 0,
      paidAmount: 0,
      balanceAmount: 0,
      paidAt: null,
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const {
      status,
      paymentStatus,
      dayType,
      search,
      startDate,
      endDate,
      limit = 100,
    } = req.query;

    const filter = {};

    if (status) filter.orderStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (dayType) filter.dayType = dayType;

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { "items.productName": { $regex: search, $options: "i" } },
        { ageGroup: { $regex: search, $options: "i" } },
      ];
    }

    if (startDate || endDate) {
      const range = getColomboDateRange(startDate, endDate);

      filter.placedAt = {
        $gte: range.start,
        $lte: range.end,
      };
    }

    const safeLimit = Math.min(Number(limit) || 100, 100000);

    const orders = await Order.find(filter)
      .sort({ placedAt: -1, createdAt: -1 })
      .limit(safeLimit);

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

exports.getDailySales = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const range = getColomboDateRange(startDate, endDate);

    const rows = await Order.aggregate([
      {
        $match: {
          placedAt: {
            $gte: range.start,
            $lte: range.end,
          },
          orderStatus: { $ne: "Cancelled" },
          paymentStatus: { $ne: "Cancelled" },
        },
      },
      {
        $unwind: "$items",
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$placedAt",
                timezone: "Asia/Colombo",
              },
            },
            productName: "$items.productName",
          },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.lineTotal" },
          categoryName: { $first: "$items.categoryName" },
          image: { $first: "$items.image" },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          productName: "$_id.productName",
          totalQuantity: 1,
          totalRevenue: 1,
          categoryName: 1,
          image: 1,
        },
      },
      {
        $sort: {
          date: 1,
          productName: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      startDate: range.safeStartDate,
      endDate: range.safeEndDate,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const {
      ageGroup,
      groupSize,
      weather,
      dayType,
      orderStatus,
      paymentStatus,
      paymentMethod,
      note,
      items,
      discountAmount,
      paidAmount,
      balanceAmount,
      paidAt,
    } = req.body;

    if (ageGroup !== undefined) order.ageGroup = ageGroup;

    if (groupSize !== undefined) {
      order.groupSize = Number(groupSize) > 0 ? Number(groupSize) : 1;
    }

    if (weather !== undefined) order.weather = weather;

    if (dayType !== undefined) {
      order.dayType = dayType === "Holiday" ? "Holiday" : "Work Day";
    }

    if (orderStatus !== undefined) order.orderStatus = orderStatus;
    if (paymentStatus !== undefined) order.paymentStatus = paymentStatus;
    if (paymentMethod !== undefined) order.paymentMethod = paymentMethod;
    if (note !== undefined) order.note = note;

    if (discountAmount !== undefined) {
      order.discountAmount = normalizeMoney(discountAmount);
    }

    if (paidAmount !== undefined) {
      order.paidAmount = normalizeMoney(paidAmount);
    }

    if (balanceAmount !== undefined) {
      order.balanceAmount = normalizeMoney(balanceAmount);
    }

    if (paidAt !== undefined) {
      order.paidAt = paidAt ? new Date(paidAt) : null;
    }

    if (items !== undefined) {
      const cleanItems = normalizeOrderItems(items);

      order.items = cleanItems;
      order.totalCost = Number(
        cleanItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)
      );
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order updated successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (orderStatus !== undefined) {
      order.orderStatus = orderStatus;
    }

    if (paymentStatus !== undefined) {
      order.paymentStatus = paymentStatus;

      if (paymentStatus === "Paid") {
        order.discountAmount = order.discountAmount || 0;
        order.paidAmount = order.paidAmount || order.totalCost;
        order.balanceAmount = order.balanceAmount || 0;
        order.paidAt = order.paidAt || new Date();
      }

      if (paymentStatus === "Pending") {
        order.discountAmount = 0;
        order.paidAmount = 0;
        order.balanceAmount = 0;
        order.paidAt = null;
      }
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

exports.confirmPayment = async (req, res, next) => {
  try {
    const { paidAmount, discountAmount, paymentMethod, note } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "Paid") {
      return res.status(400).json({
        success: false,
        message: "Payment is already confirmed for this order",
      });
    }

    if (order.paymentStatus === "Cancelled" || order.orderStatus === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled orders cannot be paid",
      });
    }

    const cleanDiscount = normalizeMoney(discountAmount);
    const cleanPaidAmount = normalizeMoney(paidAmount);
    const payableAmount = normalizeMoney(Math.max(order.totalCost - cleanDiscount, 0));

    if (cleanDiscount > order.totalCost) {
      return res.status(400).json({
        success: false,
        message: "Discount cannot be greater than order total",
      });
    }

    if (cleanPaidAmount < payableAmount) {
      return res.status(400).json({
        success: false,
        message: "Payment amount is less than grand total",
      });
    }

    const balanceAmount = normalizeMoney(cleanPaidAmount - payableAmount);

    order.discountAmount = cleanDiscount;
    order.paidAmount = cleanPaidAmount;
    order.balanceAmount = balanceAmount;
    order.paymentStatus = "Paid";
    order.paymentMethod = paymentMethod || "Cashier";
    order.paidAt = new Date();

    if (note !== undefined) {
      order.note = note;
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Payment confirmed successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
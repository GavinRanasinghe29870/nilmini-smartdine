const Order = require("../models/Order");

function createOrderNumber() {
  const timePart = Date.now().toString().slice(-6);
  const randomPart = Math.floor(100 + Math.random() * 900);
  return `ORD-${timePart}${randomPart}`;
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
    });

    res.status(201).json({
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
      filter.placedAt = {};

      if (startDate) {
        filter.placedAt.$gte = new Date(startDate);
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.placedAt.$lte = end;
      }
    }

    const orders = await Order.find(filter)
      .sort({ placedAt: -1 })
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
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

    res.status(200).json({
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

    if (items !== undefined) {
      const cleanItems = normalizeOrderItems(items);
      order.items = cleanItems;
      order.totalCost = Number(
        cleanItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)
      );
    }

    await order.save();

    res.status(200).json({
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

    const updateData = {};

    if (orderStatus !== undefined) updateData.orderStatus = orderStatus;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;

    const order = await Order.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
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

    res.status(200).json({
      success: true,
      message: "Order deleted successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
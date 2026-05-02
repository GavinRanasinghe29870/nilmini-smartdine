const Order = require("../models/Order");
const DailyProductSales = require("../models/DailyProductSales");

const TIME_ZONE = "Asia/Colombo";

function getColomboDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(date));

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function getDayRangeForColomboDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);

  const start = new Date(Date.UTC(year, month - 1, day - 1, 18, 30, 0, 0));
  const end = new Date(Date.UTC(year, month - 1, day, 18, 29, 59, 999));

  return { start, end };
}

async function rebuildDailySalesForDate(dateString) {
  const { start, end } = getDayRangeForColomboDate(dateString);

  const orders = await Order.find({
    placedAt: {
      $gte: start,
      $lte: end,
    },
    orderStatus: {
      $ne: "Cancelled",
    },
    paymentStatus: {
      $ne: "Cancelled",
    },
  }).lean();

  const productMap = new Map();

  let weather = "Normal";
  let dayType = "Work Day";

  for (const order of orders) {
    weather = order.weather || weather;
    dayType = order.dayType || dayType;

    for (const item of order.items || []) {
      const productName = String(item.productName || "").trim();

      if (!productName) continue;

      const key = productName.toLowerCase();

      if (!productMap.has(key)) {
        productMap.set(key, {
          date: dateString,
          productId: String(item.productId || ""),
          productName,
          categoryName: String(item.categoryName || ""),
          totalQuantity: 0,
          weather,
          dayType,
        });
      }

      productMap.get(key).totalQuantity += Number(item.quantity || 0);
    }
  }

  await DailyProductSales.deleteMany({ date: dateString });

  const rows = Array.from(productMap.values()).filter(
    (row) => row.totalQuantity > 0
  );

  if (rows.length > 0) {
    await DailyProductSales.insertMany(rows);
  }

  return rows;
}

async function rebuildDailySalesForOrder(order) {
  const dateString = getColomboDateString(order.placedAt || order.createdAt);
  return rebuildDailySalesForDate(dateString);
}

async function getDailySalesHistory({ startDate, endDate, productName }) {
  const filter = {};

  if (startDate || endDate) {
    filter.date = {};

    if (startDate) filter.date.$gte = startDate;
    if (endDate) filter.date.$lte = endDate;
  }

  if (productName) {
    filter.productName = {
      $regex: `^${productName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      $options: "i",
    };
  }

  return DailyProductSales.find(filter).sort({ date: 1, productName: 1 }).lean();
}

module.exports = {
  getColomboDateString,
  rebuildDailySalesForDate,
  rebuildDailySalesForOrder,
  getDailySalesHistory,
};
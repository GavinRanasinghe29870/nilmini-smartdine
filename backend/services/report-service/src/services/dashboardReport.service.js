const { fetchJson, buildQueryUrl } = require("./httpClient.service");

const ORDER_SERVICE_URL =
  process.env.ORDER_SERVICE_URL || "http://order-service:5006";

const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || "http://product-service:5004";

const AI_MENU_SERVICE_URL =
  process.env.AI_MENU_SERVICE_URL || "http://ai-menu-service:5005";

const TIME_ZONE = "Asia/Colombo";

const MONTH_LABELS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

function getColomboDateString(offsetDays = 0) {
  const now = new Date();
  const targetDate = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(targetDate);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function getCurrentColomboYearMonth() {
  const today = getColomboDateString(0);
  const [year, month] = today.split("-");

  return {
    today,
    year,
    month,
    yearStartDate: `${year}-01-01`,
    monthStartDate: `${year}-${month}-01`,
  };
}

function addDaysToDateString(dateString, days) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days, 0, 0, 0));

  return date.toISOString().slice(0, 10);
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9\s#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function formatCurrency(value) {
  return `Rs. ${roundMoney(value).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function isValidOrder(order) {
  return order.orderStatus !== "Cancelled" && order.paymentStatus !== "Cancelled";
}

function getOrderDate(order) {
  const sourceDate = order.placedAt || order.createdAt || order.updatedAt;

  if (!sourceDate) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(sourceDate));

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function getWeekKey(dateString) {
  if (!dateString) return "Unknown";

  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const firstDay = new Date(Date.UTC(year, 0, 1));
  const dayOfYear = Math.floor((date - firstDay) / 86400000) + 1;
  const weekNumber = Math.ceil(dayOfYear / 7);

  return `W${String(weekNumber).padStart(2, "0")}`;
}

function getProductId(product) {
  return String(product?.id || product?._id || "").trim();
}

function mapProductsByIdAndName(products = []) {
  const map = new Map();

  for (const product of products) {
    const id = getProductId(product);
    const name = normalizeText(product.name);
    const itemId = normalizeText(product.itemId);

    if (id) map.set(id, product);
    if (name) map.set(name, product);
    if (itemId) map.set(itemId, product);
  }

  return map;
}

async function getOrders(startDate, endDate) {
  const url = buildQueryUrl(`${ORDER_SERVICE_URL}/api/orders`, {
    startDate,
    endDate,
    limit: 100000,
  });

  const payload = await fetchJson(url);
  return payload.data || [];
}

async function getProducts() {
  const payload = await fetchJson(`${PRODUCT_SERVICE_URL}/api/products`);
  return payload.data || [];
}

async function getGeneratedMenus() {
  const payload = await fetchJson(`${AI_MENU_SERVICE_URL}/api/ai-menu`);
  return payload.data || [];
}

function summarizeOrders(orders = []) {
  return orders.reduce(
    (acc, order) => {
      if (!isValidOrder(order)) return acc;

      acc.totalOrders += 1;
      acc.totalRevenue += Number(order.totalCost || 0);

      for (const item of order.items || []) {
        acc.totalUnits += Number(item.quantity || 0);
      }

      return acc;
    },
    {
      totalOrders: 0,
      totalUnits: 0,
      totalRevenue: 0,
    }
  );
}

function buildPopularDishes(orders = [], products = [], limit = 4) {
  const productMap = mapProductsByIdAndName(products);
  const grouped = new Map();

  for (const order of orders) {
    if (!isValidOrder(order)) continue;

    for (const item of order.items || []) {
      const productId = String(item.productId || "").trim();
      const productName = String(item.productName || "").trim();

      if (!productName) continue;

      const product =
        productMap.get(productId) || productMap.get(normalizeText(productName));

      const key = productId || normalizeText(productName);

      if (!grouped.has(key)) {
        grouped.set(key, {
          id: productId || getProductId(product) || key,
          productId: productId || getProductId(product) || "",
          productName,
          categoryName: item.categoryName || product?.categoryName || "",
          image: item.image || product?.image || "",
          price: Number(item.unitPrice || product?.price || 0),
          availability: product?.availability || "In Stock",
          unitSold: 0,
          revenue: 0,
        });
      }

      const row = grouped.get(key);
      const quantity = Number(item.quantity || 0);
      const lineTotal =
        Number(item.lineTotal || 0) > 0
          ? Number(item.lineTotal)
          : quantity * Number(item.unitPrice || product?.price || 0);

      row.unitSold += quantity;
      row.revenue += lineTotal;

      if (!row.image && product?.image) row.image = product.image;
      if (!row.categoryName && product?.categoryName) {
        row.categoryName = product.categoryName;
      }
      if (!row.price && product?.price) row.price = Number(product.price || 0);
      if (product?.availability) row.availability = product.availability;
    }
  }

  const popularFromSales = Array.from(grouped.values())
    .sort((a, b) => b.unitSold - a.unitSold)
    .slice(0, limit)
    .map((item) => ({
      ...item,
      revenue: roundMoney(item.revenue),
      price: roundMoney(item.price),
    }));

  if (popularFromSales.length > 0) {
    return popularFromSales;
  }

  return products.slice(0, limit).map((product) => ({
    id: getProductId(product),
    productId: getProductId(product),
    productName: product.name,
    categoryName: product.categoryName || "",
    image: product.image || "",
    price: roundMoney(product.price || 0),
    availability: product.availability || "In Stock",
    unitSold: 0,
    revenue: 0,
  }));
}

function getLatestTomorrowMenu(menus = [], tomorrowDate) {
  return menus.find(
    (menu) =>
      menu.menuDate === tomorrowDate &&
      ["draft", "approved"].includes(String(menu.status || "").toLowerCase())
  );
}

function buildPredictedMenu(menu, limit = 4) {
  if (!menu || !Array.isArray(menu.menuItems)) return [];

  return [...menu.menuItems]
    .filter(
      (item) =>
        Number(item.recommendedProductionQuantity || item.predictedQuantity || 0) >
        0
    )
    .sort(
      (a, b) =>
        Number(b.recommendedProductionQuantity || b.predictedQuantity || 0) -
        Number(a.recommendedProductionQuantity || a.predictedQuantity || 0)
    )
    .slice(0, limit)
    .map((item) => ({
      productId: item.productId || "",
      productName: item.productName || "",
      categoryName: item.categoryName || "",
      image: item.productImage || item.image || "",
      price: roundMoney(item.price || 0),
      availability: item.availability || "In Stock",
      predictedQuantity: Number(item.predictedQuantity || 0),
      recommendedProductionQuantity: Number(
        item.recommendedProductionQuantity || item.predictedQuantity || 0
      ),
      confidence: item.confidence || item.reliability || "Review",
      managerReviewRequired: Boolean(item.managerReviewRequired),
    }));
}

function buildCustomerGroupSummary(menu, orders = []) {
  const predictedGroup = String(
    menu?.customerPreference?.predictedCustomerGroup || ""
  ).trim();

  if (predictedGroup) {
    const confidence = Number(
      menu?.customerPreference?.confidencePercentage || 0
    );

    return {
      value: predictedGroup,
      subtitle:
        confidence > 0
          ? `${confidence}% confidence`
          : "Based on customer preference prediction",
      source: "ai-menu",
    };
  }

  const grouped = new Map();

  for (const order of orders) {
    if (!isValidOrder(order)) continue;

    const ageGroup = String(order.ageGroup || "Not Provided").trim();
    if (!ageGroup || ageGroup === "Not Provided") continue;

    grouped.set(
      ageGroup,
      (grouped.get(ageGroup) || 0) + Number(order.groupSize || 1)
    );
  }

  let bestGroup = "No data yet";
  let bestCount = 0;

  for (const [ageGroup, count] of grouped.entries()) {
    if (count > bestCount) {
      bestGroup = ageGroup;
      bestCount = count;
    }
  }

  return {
    value: bestGroup,
    subtitle:
      bestCount > 0
        ? `Fallback from recent orders: ${bestCount} customers`
        : "Generate tomorrow AI menu to view predicted group",
    source: "orders-fallback",
  };
}

function buildMonthlyOverview(orders = [], currentYear) {
  const map = new Map();

  MONTH_LABELS.forEach((month, index) => {
    map.set(String(index + 1).padStart(2, "0"), {
      label: month,
      sales: 0,
      revenue: 0,
    });
  });

  for (const order of orders) {
    if (!isValidOrder(order)) continue;

    const date = getOrderDate(order);
    if (!date || !date.startsWith(`${currentYear}-`)) continue;

    const month = date.slice(5, 7);
    const row = map.get(month);

    if (!row) continue;

    row.revenue += Number(order.totalCost || 0);

    for (const item of order.items || []) {
      row.sales += Number(item.quantity || 0);
    }
  }

  return Array.from(map.values()).map((item) => ({
    ...item,
    revenue: roundMoney(item.revenue),
  }));
}

function buildDailyOverview(orders = [], startDate, endDate) {
  const map = new Map();
  let cursor = startDate;

  while (cursor <= endDate) {
    map.set(cursor, {
      label: cursor.slice(5),
      date: cursor,
      sales: 0,
      revenue: 0,
    });

    cursor = addDaysToDateString(cursor, 1);
  }

  for (const order of orders) {
    if (!isValidOrder(order)) continue;

    const date = getOrderDate(order);
    const row = map.get(date);

    if (!row) continue;

    row.revenue += Number(order.totalCost || 0);

    for (const item of order.items || []) {
      row.sales += Number(item.quantity || 0);
    }
  }

  return Array.from(map.values()).map((item) => ({
    ...item,
    revenue: roundMoney(item.revenue),
  }));
}

function buildWeeklyOverview(orders = []) {
  const map = new Map();

  for (const order of orders) {
    if (!isValidOrder(order)) continue;

    const date = getOrderDate(order);
    const week = getWeekKey(date);

    if (!map.has(week)) {
      map.set(week, {
        label: week,
        sales: 0,
        revenue: 0,
      });
    }

    const row = map.get(week);
    row.revenue += Number(order.totalCost || 0);

    for (const item of order.items || []) {
      row.sales += Number(item.quantity || 0);
    }
  }

  return Array.from(map.values())
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((item) => ({
      ...item,
      revenue: roundMoney(item.revenue),
    }));
}

async function safeLoad(label, loader, fallback, warnings) {
  try {
    const data = await loader();
    return Array.isArray(data) ? data : fallback;
  } catch (error) {
    warnings.push(`${label}: ${error.message}`);
    return fallback;
  }
}

async function buildDashboardReport() {
  const { today, year, monthStartDate, yearStartDate } =
    getCurrentColomboYearMonth();

  const tomorrowDate = getColomboDateString(1);
  const warnings = [];

  const [todayOrders, monthOrders, yearOrders, products, generatedMenus] =
    await Promise.all([
      safeLoad("Today orders", () => getOrders(today, today), [], warnings),
      safeLoad(
        "Monthly orders",
        () => getOrders(monthStartDate, today),
        [],
        warnings
      ),
      safeLoad(
        "Year orders",
        () => getOrders(yearStartDate, today),
        [],
        warnings
      ),
      safeLoad("Products", getProducts, [], warnings),
      safeLoad("AI menus", getGeneratedMenus, [], warnings),
    ]);

  const todaySummary = summarizeOrders(todayOrders);
  const monthSummary = summarizeOrders(monthOrders);
  const tomorrowMenu = getLatestTomorrowMenu(generatedMenus, tomorrowDate);
  const customerGroup = buildCustomerGroupSummary(tomorrowMenu, monthOrders);

  return {
    success: true,
    dateContext: {
      today,
      tomorrow: tomorrowDate,
      currentYear: year,
      monthStartDate,
      yearStartDate,
      timezone: TIME_ZONE,
    },
    statCards: {
      dailySales: {
        title: "Daily Sales",
        value: formatCurrency(todaySummary.totalRevenue),
        subtitle: `${today} • ${todaySummary.totalUnits} units • ${todaySummary.totalOrders} orders`,
        rawValue: roundMoney(todaySummary.totalRevenue),
      },
      monthlyRevenue: {
        title: "Monthly Revenue",
        value: formatCurrency(monthSummary.totalRevenue),
        subtitle: `${monthStartDate} to ${today}`,
        rawValue: roundMoney(monthSummary.totalRevenue),
      },
      tomorrowCustomerGroup: {
        title: "Mostly visiting customers for Tomorrow",
        value: customerGroup.value,
        subtitle: customerGroup.subtitle,
        source: customerGroup.source,
      },
    },
    popularDishes: buildPopularDishes(monthOrders, products, 4),
    predictedMenu: {
      menuDate: tomorrowDate,
      status: tomorrowMenu?.status || "not_generated",
      summary: tomorrowMenu?.summary || "",
      items: buildPredictedMenu(tomorrowMenu, 4),
    },
    overview: {
      monthly: buildMonthlyOverview(yearOrders, year),
      weekly: buildWeeklyOverview(monthOrders),
      daily: buildDailyOverview(monthOrders, monthStartDate, today),
    },
    warnings,
  };
}

module.exports = {
  buildDashboardReport,
};
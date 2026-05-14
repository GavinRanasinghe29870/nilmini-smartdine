const { fetchJson, buildQueryUrl } = require("./httpClient.service");

const ORDER_SERVICE_URL =
  process.env.ORDER_SERVICE_URL || "http://order-service:5006";

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

function normalizeDateRange(startDate, endDate) {
  const safeEndDate = endDate || getColomboDateString(0);
  const safeStartDate = startDate || safeEndDate;

  return {
    safeStartDate,
    safeEndDate,
  };
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

function getColomboDateTimeParts(value) {
  const date = new Date(value);

  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const timeParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const year = dateParts.find((p) => p.type === "year")?.value;
  const month = dateParts.find((p) => p.type === "month")?.value;
  const day = dateParts.find((p) => p.type === "day")?.value;

  const hour = timeParts.find((p) => p.type === "hour")?.value;
  const minute = timeParts.find((p) => p.type === "minute")?.value;

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`,
  };
}

function normalizeHoliday(dayType) {
  const text = normalizeText(dayType);

  if (text === "holiday" || text === "yes") {
    return "Yes";
  }

  return "No";
}

function isValidOrder(order) {
  return order.orderStatus !== "Cancelled" && order.paymentStatus !== "Cancelled";
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

function buildSalesRowsFromOrders(orders) {
  const rows = [];

  for (const order of orders || []) {
    if (!isValidOrder(order)) continue;

    const dateSource = order.placedAt || order.createdAt || order.updatedAt;
    const dateTime = getColomboDateTimeParts(dateSource);

    const ageGroup = String(order.ageGroup || "Not Provided").trim();
    const groupSize = Number(order.groupSize || 1);
    const weather = String(order.weather || "Normal").trim();
    const holiday = normalizeHoliday(order.dayType);
    const orderNumber = String(order.orderNumber || "").trim();

    const items = (order.items || [])
      .map((item) => {
        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.unitPrice || item.price || 0);
        const lineTotal =
          Number(item.lineTotal || 0) > 0
            ? Number(item.lineTotal)
            : quantity * unitPrice;

        return {
          productId: String(item.productId || ""),
          productName: String(item.productName || "").trim(),
          categoryName: String(item.categoryName || "").trim(),
          image: String(item.image || ""),
          quantity,
          unitPrice: roundMoney(unitPrice),
          lineTotal: roundMoney(lineTotal),
        };
      })
      .filter((item) => item.productName && item.quantity > 0);

    if (!items.length) continue;

    const totalUnits = items.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );

    const totalRevenue = items.reduce(
      (sum, item) => sum + Number(item.lineTotal || 0),
      0
    );

    const productNames = items.map((item) => item.productName);

    rows.push({
      id: String(order.id || order._id || orderNumber),
      orderId: String(order.id || order._id || ""),
      orderNumber,
      date: dateTime.date,
      time: dateTime.time,

      productSummary:
        productNames.length > 2
          ? `${productNames.slice(0, 2).join(", ")} +${productNames.length - 2} more`
          : productNames.join(", "),

      itemCount: items.length,
      totalUnits,
      ageGroup,
      groupSize,
      ageGroupWithSize: `${ageGroup} - ${groupSize}`,
      weather,
      holiday,
      totalRevenue: roundMoney(totalRevenue),
      orderStatus: order.orderStatus || "",
      paymentStatus: order.paymentStatus || "",
      paymentMethod: order.paymentMethod || "",
      note: order.note || "",
      placedAt: order.placedAt || "",
      items,
    });
  }

  return rows;
}

function filterSalesRows(rows, filters) {
  const searchText = normalizeText(filters.search);
  const ageGroupText = normalizeText(filters.ageGroup);
  const weatherText = normalizeText(filters.weather);
  const holidayText = normalizeText(filters.holiday);

  return rows.filter((row) => {
    if (searchText) {
      const itemText = (row.items || [])
        .map((item) => `${item.productName} ${item.categoryName}`)
        .join(" ");

      const matched =
        normalizeText(row.orderNumber).includes(searchText) ||
        normalizeText(row.productSummary).includes(searchText) ||
        normalizeText(itemText).includes(searchText) ||
        normalizeText(row.ageGroup).includes(searchText) ||
        normalizeText(row.weather).includes(searchText);

      if (!matched) return false;
    }

    if (ageGroupText && normalizeText(row.ageGroup) !== ageGroupText) {
      return false;
    }

    if (weatherText && normalizeText(row.weather) !== weatherText) {
      return false;
    }

    if (holidayText && normalizeText(row.holiday) !== holidayText) {
      return false;
    }

    return true;
  });
}

function sortSalesRows(rows, sortBy, sortOrder) {
  const direction = sortOrder === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    if (sortBy === "ageGroup") {
      return a.ageGroup.localeCompare(b.ageGroup) * direction;
    }

    if (sortBy === "weather") {
      return a.weather.localeCompare(b.weather) * direction;
    }

    if (sortBy === "orderNumber") {
      return a.orderNumber.localeCompare(b.orderNumber) * direction;
    }

    if (sortBy === "date") {
      const aValue = `${a.date} ${a.time}`;
      const bValue = `${b.date} ${b.time}`;
      return aValue.localeCompare(bValue) * direction;
    }

    const aValue = Number(a[sortBy] || 0);
    const bValue = Number(b[sortBy] || 0);

    return (aValue - bValue) * direction;
  });
}

function buildSummary(rows) {
  const productTotals = new Map();

  const summary = rows.reduce(
    (acc, row) => {
      acc.totalOrders += 1;
      acc.totalUnitSold += Number(row.totalUnits || 0);
      acc.totalSalesRevenue += Number(row.totalRevenue || 0);

      for (const item of row.items || []) {
        productTotals.set(
          item.productName,
          (productTotals.get(item.productName) || 0) + Number(item.quantity || 0)
        );
      }

      return acc;
    },
    {
      totalOrders: 0,
      totalUnitSold: 0,
      totalSalesRevenue: 0,
      bestSellingProduct: "",
      bestSellingUnits: 0,
    }
  );

  for (const [productName, units] of productTotals.entries()) {
    if (units > summary.bestSellingUnits) {
      summary.bestSellingProduct = productName;
      summary.bestSellingUnits = units;
    }
  }

  return {
    totalOrders: summary.totalOrders,
    totalUnitSold: summary.totalUnitSold,
    totalSalesRevenue: roundMoney(summary.totalSalesRevenue),
    bestSellingProduct: summary.bestSellingProduct,
    bestSellingUnits: summary.bestSellingUnits,
  };
}

function buildChartData(rows) {
  const dailyMap = new Map();
  const productMap = new Map();

  for (const row of rows) {
    if (!dailyMap.has(row.date)) {
      dailyMap.set(row.date, {
        date: row.date,
        sales: 0,
        revenue: 0,
      });
    }

    const currentDaily = dailyMap.get(row.date);

    currentDaily.sales += Number(row.totalUnits || 0);
    currentDaily.revenue += Number(row.totalRevenue || 0);

    for (const item of row.items || []) {
      if (!productMap.has(item.productName)) {
        productMap.set(item.productName, {
          productName: item.productName,
          unitSold: 0,
          revenue: 0,
        });
      }

      const currentProduct = productMap.get(item.productName);

      currentProduct.unitSold += Number(item.quantity || 0);
      currentProduct.revenue += Number(item.lineTotal || 0);
    }
  }

  const lineData = Array.from(dailyMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => ({
      date: item.date,
      sales: item.sales,
      revenue: roundMoney(item.revenue),
    }));

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.unitSold - a.unitSold)
    .slice(0, 10)
    .map((item) => ({
      productName: item.productName,
      unitSold: item.unitSold,
      revenue: roundMoney(item.revenue),
    }));

  return {
    lineData,
    topProducts,
  };
}

function buildFilterOptions(rows) {
  const ageGroups = new Set();
  const weatherTypes = new Set();
  const holidayTypes = new Set();

  for (const row of rows) {
    if (row.ageGroup) ageGroups.add(row.ageGroup);
    if (row.weather) weatherTypes.add(row.weather);
    if (row.holiday) holidayTypes.add(row.holiday);
  }

  return {
    ageGroups: Array.from(ageGroups).sort(),
    weatherTypes: Array.from(weatherTypes).sort(),
    holidayTypes: Array.from(holidayTypes).sort(),
  };
}

async function buildSalesReport({
  startDate,
  endDate,
  search = "",
  sortBy = "date",
  sortOrder = "desc",
  ageGroup = "",
  weather = "",
  holiday = "",
}) {
  const { safeStartDate, safeEndDate } = normalizeDateRange(startDate, endDate);

  const warnings = [];
  let orders = [];

  try {
    orders = await getOrders(safeStartDate, safeEndDate);
  } catch (error) {
    warnings.push(error.message);
  }

  const allRows = buildSalesRowsFromOrders(orders);

  const filteredRows = filterSalesRows(allRows, {
    search,
    ageGroup,
    weather,
    holiday,
  });

  const sortedRows = sortSalesRows(filteredRows, sortBy, sortOrder);
  const summary = buildSummary(sortedRows);
  const charts = buildChartData(sortedRows);
  const filterOptions = buildFilterOptions(allRows);

  return {
    success: true,
    filters: {
      startDate: safeStartDate,
      endDate: safeEndDate,
      search,
      sortBy,
      sortOrder,
      ageGroup,
      weather,
      holiday,
    },
    summary,
    charts,
    filterOptions,
    warnings,
    data: sortedRows,
  };
}

module.exports = {
  buildSalesReport,
};
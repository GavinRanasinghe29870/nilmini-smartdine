const { fetchJson, buildQueryUrl } = require("./httpClient.service");

const ORDER_SERVICE_URL =
  process.env.ORDER_SERVICE_URL || "http://order-service:5006";

const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || "http://product-service:5004";

const INVENTORY_SERVICE_URL =
  process.env.INVENTORY_SERVICE_URL || "http://inventory-service:5003";

const NO_INGREDIENTS_MARKERS = new Set([
  "__no_ingredients__",
  "no ingredient",
  "no ingredients",
  "none",
]);

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

function normalizeId(value) {
  if (!value) return "";

  if (typeof value === "object") {
    return String(value.id || value._id || value.$oid || "").trim();
  }

  return String(value).trim();
}

function parseQuantity(value) {
  if (typeof value === "number") return value;

  const match = String(value || "")
    .replace(/,/g, "")
    .match(/[-+]?\d*\.?\d+/);

  if (!match) return 0;

  return Number(match[0]);
}

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function isNoIngredientsMarker(name) {
  const value = normalizeText(name);
  return NO_INGREDIENTS_MARKERS.has(value);
}

function normalizeUnit(value) {
  const unit = String(value || "").trim().toLowerCase();

  if (["kg", "kilogram", "kilograms"].includes(unit)) return "kg";
  if (["g", "gram", "grams"].includes(unit)) return "g";

  if (["l", "liter", "litre", "liters", "litres"].includes(unit)) {
    return "litre";
  }

  if (
    ["ml", "milliliter", "millilitre", "milliliters", "millilitres"].includes(
      unit
    )
  ) {
    return "ml";
  }

  if (["piece", "pieces", "pcs", "pc", "unit", "units"].includes(unit)) {
    return "piece";
  }

  return unit || "piece";
}

function convertQuantityToInventoryUnit(quantity, ingredientUnit, inventoryUnit) {
  const from = normalizeUnit(ingredientUnit);
  const to = normalizeUnit(inventoryUnit);

  if (from === to) return quantity;

  if (from === "g" && to === "kg") return quantity / 1000;
  if (from === "kg" && to === "g") return quantity * 1000;

  if (from === "ml" && to === "litre") return quantity / 1000;
  if (from === "litre" && to === "ml") return quantity * 1000;

  return quantity;
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

async function getInventoryItems() {
  const payload = await fetchJson(`${INVENTORY_SERVICE_URL}/api/inventory`);
  return payload.data || [];
}

function addMapKey(map, key, value) {
  const normalizedKey = String(key || "").trim();

  if (normalizedKey) {
    map.set(normalizedKey, value);
  }
}

function addNormalizedMapKey(map, key, value) {
  const normalizedKey = normalizeText(key);

  if (normalizedKey) {
    map.set(normalizedKey, value);
  }
}

function buildProductMap(products) {
  const map = new Map();

  for (const product of products || []) {
    const id = normalizeId(product.id || product._id);
    const itemId = product.itemId;
    const name = product.name;

    addMapKey(map, id, product);
    addMapKey(map, normalizeId(product._id), product);
    addNormalizedMapKey(map, name, product);
    addNormalizedMapKey(map, itemId, product);
  }

  return map;
}

function buildInventoryMap(inventoryItems) {
  const map = new Map();

  for (const item of inventoryItems || []) {
    const id = normalizeId(item.id || item._id);

    const possibleNames = [
      item.name,
      item.ingredientName,
      item.itemName,
      item.productName,
      item.inventoryName,
    ];

    addMapKey(map, id, item);

    for (const nameValue of possibleNames) {
      addNormalizedMapKey(map, nameValue, item);
    }
  }

  return map;
}

function getInventoryUnit(item) {
  return (
    item?.unit ||
    item?.measureType ||
    item?.measuringType ||
    item?.measurementType ||
    "Piece"
  );
}

function getInventoryUnitCost(item) {
  const possibleCostFields = [
    item?.cost,
    item?.unitCost,
    item?.costPerUnit,
    item?.pricePerUnit,
    item?.purchaseUnitPrice,
    item?.costPrice,
  ];

  for (const value of possibleCostFields) {
    const numberValue = Number(value);

    if (Number.isFinite(numberValue) && numberValue > 0) {
      return numberValue;
    }
  }

  return 0;
}

function getValidIngredients(product) {
  const ingredients = Array.isArray(product?.ingredients)
    ? product.ingredients
    : [];

  return ingredients.filter((ingredient) => {
    const ingredientName = String(ingredient?.name || "").trim();
    return ingredientName && !isNoIngredientsMarker(ingredientName);
  });
}

function calculateExpenseForOneProduct(product, inventoryMap) {
  if (!product) {
    return {
      expensePerUnit: 0,
      expenseStatus: "product_not_found",
      missingIngredients: [],
    };
  }

  const ingredients = getValidIngredients(product);

  if (ingredients.length === 0) {
    return {
      expensePerUnit: 0,
      expenseStatus: "no_ingredients",
      missingIngredients: [],
    };
  }

  let expensePerUnit = 0;
  const missingIngredients = [];

  for (const ingredient of ingredients) {
    const ingredientName = String(ingredient.name || "").trim();
    const ingredientKey = normalizeText(ingredientName);

    if (!ingredientKey) continue;

    const inventoryItem = inventoryMap.get(ingredientKey);

    if (!inventoryItem) {
      missingIngredients.push(ingredientName);
      continue;
    }

    const ingredientQuantityForOneProduct = parseQuantity(ingredient.quantity);
    const ingredientUnit = ingredient.unit || getInventoryUnit(inventoryItem);
    const inventoryUnit = getInventoryUnit(inventoryItem);
    const inventoryUnitCost = getInventoryUnitCost(inventoryItem);

    if (!ingredientQuantityForOneProduct || !inventoryUnitCost) {
      continue;
    }

    const convertedQuantity = convertQuantityToInventoryUnit(
      ingredientQuantityForOneProduct,
      ingredientUnit,
      inventoryUnit
    );

    expensePerUnit += convertedQuantity * inventoryUnitCost;
  }

  return {
    expensePerUnit,
    expenseStatus:
      missingIngredients.length > 0 ? "missing_inventory" : "calculated",
    missingIngredients,
  };
}

function getOrderDate(order) {
  const sourceDate = order.placedAt || order.createdAt || order.updatedAt;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(sourceDate));

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function isValidOrder(order) {
  return order.orderStatus !== "Cancelled" && order.paymentStatus !== "Cancelled";
}

function getOrderItemProductId(item) {
  return normalizeId(
    item.productId || item.product?._id || item.product?.id || item._id || item.id
  );
}

function getOrderItemProductName(item) {
  return String(
    item.productName || item.name || item.product?.name || item.itemName || ""
  ).trim();
}

function findMatchedProduct(item, productMap) {
  const productId = getOrderItemProductId(item);
  const productName = getOrderItemProductName(item);
  const itemId = item.itemId || item.productItemId || item.product?.itemId;

  return (
    productMap.get(productId) ||
    productMap.get(normalizeId(item.productId?._id)) ||
    productMap.get(normalizeId(item.productId?.id)) ||
    productMap.get(normalizeText(productName)) ||
    productMap.get(normalizeText(itemId)) ||
    null
  );
}

function buildRevenueRowsFromOrders(orders, productMap, inventoryMap) {
  const grouped = new Map();
  const expenseCache = new Map();

  for (const order of orders || []) {
    if (!isValidOrder(order)) continue;

    const date = getOrderDate(order);

    for (const item of order.items || []) {
      const productId = getOrderItemProductId(item);
      const productName = getOrderItemProductName(item);

      if (!productName) continue;

      const matchedProduct = findMatchedProduct(item, productMap);
      const productKey =
        productId || matchedProduct?.id || normalizeText(productName);

      if (!expenseCache.has(productKey)) {
        expenseCache.set(
          productKey,
          calculateExpenseForOneProduct(matchedProduct, inventoryMap)
        );
      }

      const expenseInfo = expenseCache.get(productKey);

      const soldQuantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unitPrice || item.price || 0);

      const revenue =
        Number(item.lineTotal || 0) > 0
          ? Number(item.lineTotal)
          : soldQuantity * unitPrice;

      const ingredientCostPerUnit = Number(expenseInfo.expensePerUnit || 0);
      const ingredientCost = ingredientCostPerUnit * soldQuantity;

      const groupKey = `${date}__${productKey || normalizeText(productName)}`;

      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, {
          id: groupKey,
          productId: productId || matchedProduct?.id || "",
          itemId: matchedProduct?.itemId || item.itemId || "",
          productName,
          categoryName: item.categoryName || matchedProduct?.categoryName || "",
          date,
          totalQuantity: 0,
          totalUnitPriceValue: 0,

          revenue: 0,
          ingredientCost: 0,
          profit: 0,

          sellIncome: 0,
          productExpenses: 0,
          totalRevenue: 0,

          ingredientCostPerUnit,
          expensePerUnit: ingredientCostPerUnit,
          expenseStatus: expenseInfo.expenseStatus,
          missingIngredients: expenseInfo.missingIngredients,
        });
      }

      const row = grouped.get(groupKey);

      row.totalQuantity += soldQuantity;
      row.totalUnitPriceValue += unitPrice * soldQuantity;

      row.revenue += revenue;
      row.ingredientCost += ingredientCost;
      row.profit = row.revenue - row.ingredientCost;

      row.sellIncome = row.revenue;
      row.productExpenses = row.ingredientCost;
      row.totalRevenue = row.revenue;
    }
  }

  return Array.from(grouped.values()).map((row, index) => ({
    ...row,
    id: `${row.id}__${index}`,
    averageUnitPrice:
      row.totalQuantity > 0
        ? roundMoney(row.totalUnitPriceValue / row.totalQuantity)
        : 0,

    revenue: roundMoney(row.revenue),
    ingredientCost: roundMoney(row.ingredientCost),
    profit: roundMoney(row.profit),

    sellIncome: roundMoney(row.sellIncome),
    productExpenses: roundMoney(row.productExpenses),
    totalRevenue: roundMoney(row.totalRevenue),

    ingredientCostPerUnit: roundMoney(row.ingredientCostPerUnit),
    expensePerUnit: roundMoney(row.expensePerUnit),
  }));
}

function sortReportRows(rows, sortBy, sortOrder) {
  const direction = sortOrder === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    if (sortBy === "productName") {
      return a.productName.localeCompare(b.productName) * direction;
    }

    if (sortBy === "date") {
      return a.date.localeCompare(b.date) * direction;
    }

    const aValue = Number(a[sortBy] || 0);
    const bValue = Number(b[sortBy] || 0);

    return (aValue - bValue) * direction;
  });
}

function buildSummary(rows) {
  const summary = rows.reduce(
    (acc, row) => {
      acc.totalQuantity += Number(row.totalQuantity || 0);
      acc.totalRevenue += Number(row.revenue || 0);
      acc.totalIngredientCost += Number(row.ingredientCost || 0);
      acc.totalProfit += Number(row.profit || 0);
      return acc;
    },
    {
      totalQuantity: 0,
      totalRevenue: 0,
      totalIngredientCost: 0,
      totalProfit: 0,
    }
  );

  return {
    totalQuantity: summary.totalQuantity,
    totalRevenue: roundMoney(summary.totalRevenue),
    totalIngredientCost: roundMoney(summary.totalIngredientCost),
    totalProfit: roundMoney(summary.totalProfit),

    totalIncome: roundMoney(summary.totalRevenue),
    totalExpenses: roundMoney(summary.totalIngredientCost),
  };
}

function buildChartData(rows, summary) {
  const dailyMap = new Map();

  for (const row of rows) {
    if (!dailyMap.has(row.date)) {
      dailyMap.set(row.date, {
        date: row.date,
        revenue: 0,
        ingredientCost: 0,
        profit: 0,
      });
    }

    const current = dailyMap.get(row.date);

    current.revenue += Number(row.revenue || 0);
    current.ingredientCost += Number(row.ingredientCost || 0);
    current.profit += Number(row.profit || 0);
  }

  const lineData = Array.from(dailyMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => ({
      date: item.date,
      revenue: roundMoney(item.revenue),
      ingredientCost: roundMoney(item.ingredientCost),
      expenses: roundMoney(item.ingredientCost),
      profit: roundMoney(item.profit),
    }));

  const pieData = [
    {
      name: "Revenue",
      value: summary.totalRevenue,
    },
    {
      name: "Ingredient Cost",
      value: summary.totalIngredientCost,
    },
  ];

  return {
    pieData,
    lineData,
  };
}

async function buildRevenueReport({
  startDate,
  endDate,
  search,
  sortBy = "date",
  sortOrder = "desc",
}) {
  const { safeStartDate, safeEndDate } = normalizeDateRange(startDate, endDate);

  const warnings = [];

  let orders = [];
  let products = [];
  let inventoryItems = [];

  try {
    [orders, products, inventoryItems] = await Promise.all([
      getOrders(safeStartDate, safeEndDate),
      getProducts(),
      getInventoryItems(),
    ]);
  } catch (error) {
    warnings.push(error.message);
  }

  const productMap = buildProductMap(products);
  const inventoryMap = buildInventoryMap(inventoryItems);

  const searchText = normalizeText(search);

  const allRows = buildRevenueRowsFromOrders(orders, productMap, inventoryMap);

  const filteredRows = allRows.filter((row) => {
    if (!searchText) return true;

    return (
      normalizeText(row.productName).includes(searchText) ||
      normalizeText(row.categoryName).includes(searchText) ||
      normalizeText(row.itemId).includes(searchText)
    );
  });

  const sortedRows = sortReportRows(filteredRows, sortBy, sortOrder);
  const summary = buildSummary(sortedRows);
  const charts = buildChartData(sortedRows, summary);

  return {
    success: true,
    filters: {
      startDate: safeStartDate,
      endDate: safeEndDate,
      search: search || "",
      sortBy,
      sortOrder,
    },
    summary,
    charts,
    warnings,
    data: sortedRows,
  };
}

module.exports = {
  buildRevenueReport,
};
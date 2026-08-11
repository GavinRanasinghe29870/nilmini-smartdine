const GeneratedMenu = require("../models/GeneratedMenu");
const { getColomboDateString } = require("../services/date.service");

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactText(value) {
  return normalizeText(value).replace(/\s+/g, "");
}

function getMatchKeys(value) {
  const normalized = normalizeText(value);
  const compact = compactText(value);

  const keys = new Set();

  if (normalized) keys.add(normalized);
  if (compact) keys.add(compact);

  return keys;
}

function addKeys(targetSet, values = []) {
  values.forEach((value) => {
    getMatchKeys(value).forEach((key) => targetSet.add(key));
  });
}

function buildOrderItemKeys(item) {
  const keys = new Set();

  addKeys(keys, [item.productId, item.itemId, item.productName]);

  return keys;
}

function buildMenuItemKeys(item) {
  const keys = new Set();

  addKeys(keys, [
    item.productId,
    item.itemId,
    item.productDbName,
    item.productName,
  ]);

  return keys;
}

function doSetsIntersect(firstSet, secondSet) {
  for (const key of firstSet) {
    if (secondSet.has(key)) {
      return true;
    }
  }

  return false;
}

function getSafeQuantity(value) {
  const quantity = Number(value || 0);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return 0;
  }

  return Math.floor(quantity);
}

function getCurrentMenuQuantity(menuItem) {
  const quantity = Number(
    menuItem.recommendedProductionQuantity ??
      menuItem.adjustedQuantity ??
      menuItem.predictedQuantity ??
      0
  );

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return 0;
  }

  return Math.floor(quantity);
}

function normalizeMenuItemLiveQuantity(menuItem) {
  const currentQuantity = getCurrentMenuQuantity(menuItem);

  menuItem.recommendedProductionQuantity = currentQuantity;
  menuItem.availability = currentQuantity <= 0 ? "Out of Stock" : "In Stock";

  return currentQuantity;
}

function findMatchingMenuItem(menuItems, orderItem) {
  const orderKeys = buildOrderItemKeys(orderItem);

  return menuItems.find((menuItem) => {
    const menuKeys = buildMenuItemKeys(menuItem);
    return doSetsIntersect(orderKeys, menuKeys);
  });
}

async function consumeTodayMenuStock(req, res) {
  try {
    const { orderId, orderNumber, items } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order items are required",
      });
    }

    const todayDate = getColomboDateString(0);

    const todayMenu = await GeneratedMenu.findOne({
      menuDate: todayDate,
      status: "approved",
    }).sort({ approvedAt: -1, updatedAt: -1 });

    if (!todayMenu) {
      return res.status(404).json({
        success: false,
        message: `No approved Today Menu found for ${todayDate}`,
      });
    }

    const alreadyConsumed = todayMenu.stockConsumptionHistory?.some(
      (record) => String(record.orderId) === String(orderId)
    );

    if (alreadyConsumed) {
      return res.json({
        success: true,
        message: "Today Menu quantity already reduced for this order",
        data: todayMenu,
      });
    }

    const appliedItems = [];
    const warnings = [];

    for (const orderItem of items) {
      const orderQuantity = getSafeQuantity(orderItem.quantity);

      if (orderQuantity <= 0) {
        continue;
      }

      const menuItem = findMatchingMenuItem(todayMenu.menuItems, orderItem);

      if (!menuItem) {
        warnings.push(
          `Order item '${orderItem.productName}' was not found in Today Menu.`
        );
        continue;
      }

      const currentQuantity = normalizeMenuItemLiveQuantity(menuItem);
      const actualReducedQuantity = Math.min(currentQuantity, orderQuantity);
      const newQuantity = Math.max(currentQuantity - orderQuantity, 0);

      menuItem.recommendedProductionQuantity = newQuantity;
      menuItem.availability = newQuantity <= 0 ? "Out of Stock" : "In Stock";

      appliedItems.push({
        productId: orderItem.productId || "",
        itemId: orderItem.itemId || "",
        productName: orderItem.productName || "",
        quantity: actualReducedQuantity,
        matchedMenuProductName: menuItem.productName || "",
      });

      if (orderQuantity > currentQuantity) {
        warnings.push(
          `${orderItem.productName} ordered quantity (${orderQuantity}) is higher than Today Menu quantity (${currentQuantity}). Quantity was set to 0.`
        );
      }
    }

    if (appliedItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No order items were matched with Today Menu items",
        warnings,
      });
    }

    if (!Array.isArray(todayMenu.stockConsumptionHistory)) {
      todayMenu.stockConsumptionHistory = [];
    }

    todayMenu.stockConsumptionHistory.push({
      orderId,
      orderNumber: orderNumber || "",
      consumedAt: new Date(),
      items: appliedItems,
    });

    if (warnings.length > 0) {
      todayMenu.warnings = [
        ...(Array.isArray(todayMenu.warnings) ? todayMenu.warnings : []),
        ...warnings,
      ];
    }

    todayMenu.markModified("menuItems");
    todayMenu.markModified("stockConsumptionHistory");

    await todayMenu.save();

    return res.json({
      success: true,
      message: "Today Menu quantity reduced successfully",
      data: todayMenu,
      warnings,
    });
  } catch (error) {
    console.error("Consume today menu quantity error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reduce Today Menu quantity",
      error: error.message,
    });
  }
}

module.exports = {
  consumeTodayMenuStock,
};
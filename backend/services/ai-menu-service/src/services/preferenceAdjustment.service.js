function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getAdjustmentUnits(rank) {
  const minUnits = Number(process.env.PREFERENCE_ADJUSTMENT_MIN_UNITS || 10);
  const maxUnits = Number(process.env.PREFERENCE_ADJUSTMENT_MAX_UNITS || 15);

  if (rank <= 3) {
    return maxUnits;
  }

  return minUnits;
}

function buildPreferenceMap(preferredFoodItems = []) {
  const map = new Map();

  preferredFoodItems.forEach((item, index) => {
    const productName = item.productName;

    if (!productName) return;

    map.set(normalizeName(productName), {
      ...item,
      rank: index + 1,
    });
  });

  return map;
}

function adjustMenuItemsByCustomerPreference({
  menuItems = [],
  customerPreference = null,
}) {
  const preferredFoodItems = Array.isArray(customerPreference?.preferredFoodItems)
    ? customerPreference.preferredFoodItems
    : [];

  const preferenceMap = buildPreferenceMap(preferredFoodItems);

  const adjustedProducts = [];

  const adjustedMenuItems = menuItems.map((item) => {
    const predictedQuantity = toNumber(item.predictedQuantity, 0);
    const preference = preferenceMap.get(normalizeName(item.productName));

    const canAdjust =
      Boolean(preference) &&
      predictedQuantity > 0 &&
      item.productType !== "non_menu_item";

    const adjustmentValue = canAdjust ? getAdjustmentUnits(preference.rank) : 0;

    const adjustedQuantity = Math.max(
      0,
      Math.round(predictedQuantity + adjustmentValue)
    );

    const adjustmentPercent =
      predictedQuantity > 0
        ? Number(((adjustmentValue / predictedQuantity) * 100).toFixed(2))
        : 0;

    if (canAdjust) {
      adjustedProducts.push({
        productName: item.productName,
        predictedQuantity,
        adjustedQuantity,
        adjustmentValue,
        adjustmentPercent,
        preferenceScore: preference.preferenceScore ?? null,
        reason: `${item.productName} increased by ${adjustmentValue} units because ${customerPreference.predictedCustomerGroup} is predicted as the most visiting customer group and this product is preferred by that group.`,
      });
    }

    return {
      ...item,
      predictedQuantity,
      adjustedQuantity,
      recommendedProductionQuantity: adjustedQuantity,
      isPreferredForPredictedGroup: Boolean(preference),
      preferenceScore: preference?.preferenceScore ?? null,
      customerPreferenceRank: preference?.rank ?? null,
      customerPreferenceNote: preference
        ? `Preferred by predicted customer group: ${customerPreference.predictedCustomerGroup}`
        : "",
      adjustmentReason: canAdjust
        ? `Preference-based adjustment added ${adjustmentValue} units.`
        : "",
    };
  });

  return {
    adjustedMenuItems,
    adjustedProducts,
  };
}

module.exports = {
  adjustMenuItemsByCustomerPreference,
};
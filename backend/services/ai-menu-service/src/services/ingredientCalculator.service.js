function parseQuantity(value) {
  if (typeof value === "number") return value;

  const normalized = String(value || "").replace(/,/g, "").trim();
  const match = normalized.match(/[\d.]+/);

  if (!match) return 0;

  return Number(match[0]);
}

function formatQuantity(value, unit) {
  const rounded = Math.round(Number(value || 0) * 100) / 100;

  if (!unit) {
    return String(rounded);
  }

  return `${rounded} ${unit}`;
}

function calculateIngredientRequirements(menuItems) {
  const grouped = new Map();
  const warnings = [];

  for (const item of menuItems || []) {
    const productionQuantity = Number(
      item.recommendedProductionQuantity ??
        item.adjustedQuantity ??
        item.predictedQuantity ??
        0
    );

    if (!Array.isArray(item.ingredients) || item.ingredients.length === 0) {
      continue;
    }

    for (const ingredient of item.ingredients) {
      const ingredientName = String(ingredient.name || "").trim();
      const unit = String(ingredient.unit || "").trim();
      const quantityPerItem = parseQuantity(ingredient.quantity);

      if (!ingredientName || !quantityPerItem) {
        continue;
      }

      const key = `${ingredientName.toLowerCase()}__${unit.toLowerCase()}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          ingredientName,
          unit,
          requiredQuantityNumber: 0,
          relatedProducts: [],
        });
      }

      const current = grouped.get(key);

      current.requiredQuantityNumber += quantityPerItem * productionQuantity;

      if (!current.relatedProducts.includes(item.productName)) {
        current.relatedProducts.push(item.productName);
      }
    }
  }

  const ingredientList = Array.from(grouped.values())
    .map((item) => ({
      ingredientName: item.ingredientName,
      requiredQuantityNumber:
        Math.round(item.requiredQuantityNumber * 100) / 100,
      unit: item.unit,
      requiredQuantity: formatQuantity(item.requiredQuantityNumber, item.unit),
      relatedProducts: item.relatedProducts,
    }))
    .sort((a, b) => a.ingredientName.localeCompare(b.ingredientName));

  return {
    ingredientList,
    warnings,
  };
}

module.exports = {
  calculateIngredientRequirements,
};
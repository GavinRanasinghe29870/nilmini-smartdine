function parseQuantity(value) {
  if (typeof value === "number") return value;

  const match = String(value || "").match(/[\d.]+/);

  if (!match) return 0;

  return Number(match[0]);
}

function formatQuantity(value, unit) {
  const rounded = Math.round(value * 100) / 100;

  if (!unit) return String(rounded);

  return `${rounded} ${unit}`;
}

function calculateIngredientRequirements(menuItems) {
  const grouped = new Map();
  const warnings = [];

  for (const item of menuItems) {
    const productionQuantity = Number(
      item.recommendedProductionQuantity || item.predictedQuantity || 0
    );

    if (!Array.isArray(item.ingredients) || item.ingredients.length === 0) {
      warnings.push(`No ingredients found for product '${item.productName}'.`);
      continue;
    }

    for (const ingredient of item.ingredients) {
      const ingredientName = String(ingredient.name || "").trim();
      const unit = String(ingredient.unit || "").trim();
      const quantityPerUnit = parseQuantity(ingredient.quantity);

      if (!ingredientName || !quantityPerUnit) {
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

      current.requiredQuantityNumber += quantityPerUnit * productionQuantity;

      if (!current.relatedProducts.includes(item.productName)) {
        current.relatedProducts.push(item.productName);
      }
    }
  }

  const ingredientList = Array.from(grouped.values()).map((item) => ({
    ingredientName: item.ingredientName,
    requiredQuantityNumber:
      Math.round(item.requiredQuantityNumber * 100) / 100,
    unit: item.unit,
    requiredQuantity: formatQuantity(item.requiredQuantityNumber, item.unit),
    relatedProducts: item.relatedProducts,
  }));

  return {
    ingredientList,
    warnings,
  };
}

module.exports = {
  calculateIngredientRequirements,
};
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

function getNameKeys(value) {
  const normalized = normalizeText(value);
  const compact = compactText(value);

  const singular =
    normalized.endsWith("s") && normalized.length > 3
      ? normalized.slice(0, -1)
      : normalized;

  const singularCompact = singular.replace(/\s+/g, "");

  const keys = new Set();

  if (normalized) keys.add(normalized);
  if (compact) keys.add(compact);
  if (singular) keys.add(singular);
  if (singularCompact) keys.add(singularCompact);

  return keys;
}

function normalizeUnit(value) {
  const unit = String(value || "").trim().toLowerCase();

  if (["kg", "kilogram", "kilograms"].includes(unit)) return "Kg";
  if (["g", "gram", "grams"].includes(unit)) return "g";

  if (["l", "lt", "liter", "liters", "litre", "litres"].includes(unit)) {
    return "Litre";
  }

  if (
    ["ml", "milliliter", "milliliters", "millilitre", "millilitres"].includes(
      unit
    )
  ) {
    return "ml";
  }

  if (
    [
      "piece",
      "pieces",
      "pcs",
      "pc",
      "unit",
      "units",
      "count",
      "counts",
      "nos",
      "no",
    ].includes(unit)
  ) {
    return "Piece";
  }

  return String(value || "").trim();
}

function getUnitGroup(unit) {
  const normalized = normalizeUnit(unit);

  if (["Kg", "g"].includes(normalized)) return "weight";
  if (["Litre", "ml"].includes(normalized)) return "volume";
  if (normalized === "Piece") return "piece";

  return "unknown";
}

function convertQuantity(value, fromUnit, toUnit) {
  const amount = Number(value || 0);
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);

  if (!from || !to || from === to) {
    return {
      compatible: true,
      quantity: amount,
    };
  }

  const fromGroup = getUnitGroup(from);
  const toGroup = getUnitGroup(to);

  if (fromGroup !== toGroup || fromGroup === "unknown") {
    return {
      compatible: false,
      quantity: amount,
    };
  }

  if (from === "g" && to === "Kg") {
    return {
      compatible: true,
      quantity: amount / 1000,
    };
  }

  if (from === "Kg" && to === "g") {
    return {
      compatible: true,
      quantity: amount * 1000,
    };
  }

  if (from === "ml" && to === "Litre") {
    return {
      compatible: true,
      quantity: amount / 1000,
    };
  }

  if (from === "Litre" && to === "ml") {
    return {
      compatible: true,
      quantity: amount * 1000,
    };
  }

  return {
    compatible: true,
    quantity: amount,
  };
}

function roundNumber(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function formatQuantity(value, unit) {
  const rounded = roundNumber(value);

  if (!unit) return String(rounded);

  return `${rounded} ${unit}`;
}

function buildInventoryMap(inventoryItems = []) {
  const map = new Map();

  for (const item of inventoryItems) {
    for (const key of getNameKeys(item.name)) {
      if (!map.has(key)) {
        map.set(key, item);
      }
    }
  }

  return map;
}

function findInventoryItem(inventoryMap, ingredientName) {
  for (const key of getNameKeys(ingredientName)) {
    const item = inventoryMap.get(key);

    if (item) return item;
  }

  return null;
}

function calculateInventoryRequirementList(ingredientList = [], inventoryItems = []) {
  const inventoryMap = buildInventoryMap(inventoryItems);
  const warnings = [];

  const inventoryRequirementList = ingredientList.map((ingredient) => {
    const ingredientName = String(ingredient.ingredientName || "").trim();
    const ingredientUnit = normalizeUnit(ingredient.unit || "");
    const requiredQuantityOriginalUnit = Number(
      ingredient.requiredQuantityNumber || 0
    );

    const inventoryItem = findInventoryItem(inventoryMap, ingredientName);

    if (!inventoryItem) {
      warnings.push(
        `Inventory item '${ingredientName}' was not found. Full required quantity should be added.`
      );

      return {
        ingredientName,
        inventoryItemId: "",
        inventoryItemName: "",
        requiredQuantityNumber: roundNumber(requiredQuantityOriginalUnit),
        availableQuantityNumber: 0,
        shortageQuantityNumber: roundNumber(requiredQuantityOriginalUnit),
        unit: ingredientUnit,
        requiredQuantity: formatQuantity(requiredQuantityOriginalUnit, ingredientUnit),
        availableQuantity: formatQuantity(0, ingredientUnit),
        shortageQuantity: formatQuantity(requiredQuantityOriginalUnit, ingredientUnit),
        status: "Not In Inventory",
        relatedProducts: ingredient.relatedProducts || [],
      };
    }

    const inventoryUnit = normalizeUnit(inventoryItem.unit || ingredientUnit);
    const availableQuantity = Number(inventoryItem.quantity || 0);

    const convertedRequired = convertQuantity(
      requiredQuantityOriginalUnit,
      ingredientUnit,
      inventoryUnit
    );

    if (!convertedRequired.compatible) {
      warnings.push(
        `Unit mismatch for '${ingredientName}'. Product recipe uses '${ingredientUnit}' but inventory uses '${inventoryUnit}'.`
      );

      return {
        ingredientName,
        inventoryItemId: String(inventoryItem._id || inventoryItem.id || ""),
        inventoryItemName: inventoryItem.name || ingredientName,
        requiredQuantityNumber: roundNumber(requiredQuantityOriginalUnit),
        availableQuantityNumber: roundNumber(availableQuantity),
        shortageQuantityNumber: roundNumber(requiredQuantityOriginalUnit),
        unit: ingredientUnit,
        requiredQuantity: formatQuantity(requiredQuantityOriginalUnit, ingredientUnit),
        availableQuantity: formatQuantity(availableQuantity, inventoryUnit),
        shortageQuantity: formatQuantity(requiredQuantityOriginalUnit, ingredientUnit),
        status: "Unit Mismatch",
        relatedProducts: ingredient.relatedProducts || [],
      };
    }

    const requiredInInventoryUnit = convertedRequired.quantity;
    const shortage = Math.max(requiredInInventoryUnit - availableQuantity, 0);

    return {
      ingredientName,
      inventoryItemId: String(inventoryItem._id || inventoryItem.id || ""),
      inventoryItemName: inventoryItem.name || ingredientName,
      requiredQuantityNumber: roundNumber(requiredInInventoryUnit),
      availableQuantityNumber: roundNumber(availableQuantity),
      shortageQuantityNumber: roundNumber(shortage),
      unit: inventoryUnit,
      requiredQuantity: formatQuantity(requiredInInventoryUnit, inventoryUnit),
      availableQuantity: formatQuantity(availableQuantity, inventoryUnit),
      shortageQuantity: formatQuantity(shortage, inventoryUnit),
      status: shortage > 0 ? "Need Stock" : "Available",
      relatedProducts: ingredient.relatedProducts || [],
    };
  });

  return {
    inventoryRequirementList,
    warnings,
  };
}

module.exports = {
  calculateInventoryRequirementList,
};
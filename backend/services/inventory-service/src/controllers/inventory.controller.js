const InventoryItem = require("../models/inventory.model");

async function generateUniqueItemId() {
  let itemId;
  let exists = true;

  while (exists) {
    itemId = `#${Math.floor(10000000 + Math.random() * 90000000)}`;
    exists = await InventoryItem.exists({ itemId });
  }

  return itemId;
}

function getErrorMessage(error) {
  if (error instanceof Error) return error.message;
  return "Internal server error";
}

function buildImagePath(filename) {
  return `/uploads/${filename}`;
}

function roundNumber(value) {
  return Math.round(Number(value || 0) * 1000000) / 1000000;
}

function normalizeUnit(unit) {
  const value = String(unit || "")
    .trim()
    .toLowerCase();

  if (["kg", "kilogram", "kilograms"].includes(value)) {
    return {
      unit: "g",
      multiplier: 1000,
    };
  }

  if (["l", "liter", "litre", "liters", "litres"].includes(value)) {
    return {
      unit: "ml",
      multiplier: 1000,
    };
  }

  if (["g", "gram", "grams"].includes(value)) {
    return {
      unit: "g",
      multiplier: 1,
    };
  }

  if (["ml", "milliliter", "millilitre", "milliliters", "millilitres"].includes(value)) {
    return {
      unit: "ml",
      multiplier: 1,
    };
  }

  return {
    unit: "Piece",
    multiplier: 1,
  };
}

function normalizeInventoryValues({ quantity, cost, unit }) {
  const normalized = normalizeUnit(unit);
  const parsedQuantity = Number(quantity);
  const parsedCost = Number(cost);

  return {
    quantity: roundNumber(parsedQuantity * normalized.multiplier),
    cost: roundNumber(parsedCost / normalized.multiplier),
    unit: normalized.unit,
  };
}

async function migrateLegacyInventoryUnits() {
  const legacyItems = await InventoryItem.find({ unit: { $in: ["Kg", "Litre"] } });

  for (const item of legacyItems) {
    const normalized = normalizeInventoryValues({
      quantity: item.quantity,
      cost: item.cost,
      unit: item.unit,
    });

    item.quantity = normalized.quantity;
    item.cost = normalized.cost;
    item.unit = normalized.unit;

    await item.save();
  }
}

exports.getAllItems = async (req, res) => {
  try {
    await migrateLegacyInventoryUnits();

    const items = await InventoryItem.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("getAllItems error:", error);
    return res.status(500).json({
      success: false,
      message: getErrorMessage(error),
    });
  }
};

exports.createItem = async (req, res) => {
  try {
    const { name, cost, quantity, unit } = req.body;

    if (!name || cost === undefined || quantity === undefined || !unit) {
      return res.status(400).json({
        success: false,
        message: "Name, cost, quantity and unit are required",
      });
    }

    const parsedCost = Number(cost);
    const parsedQuantity = Number(quantity);

    if (Number.isNaN(parsedCost) || parsedCost < 0) {
      return res.status(400).json({
        success: false,
        message: "Cost must be a valid positive number",
      });
    }

    if (Number.isNaN(parsedQuantity) || parsedQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a valid positive number",
      });
    }

    const normalized = normalizeInventoryValues({
      quantity: parsedQuantity,
      cost: parsedCost,
      unit,
    });

    const item = await InventoryItem.create({
      name: name.trim(),
      itemId: await generateUniqueItemId(),
      cost: normalized.cost,
      quantity: normalized.quantity,
      unit: normalized.unit,
      image: req.file ? buildImagePath(req.file.filename) : "",
    });

    return res.status(201).json({
      success: true,
      message: "Item created successfully",
      data: item,
    });
  } catch (error) {
    console.error("createItem error:", error);
    return res.status(500).json({
      success: false,
      message: getErrorMessage(error),
    });
  }
};

exports.updateItem = async (req, res) => {
  try {
    await migrateLegacyInventoryUnits();

    const { id } = req.params;
    const { name, cost, quantity, unit } = req.body;

    const item = await InventoryItem.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    if (name !== undefined) item.name = name.trim();

    if (cost !== undefined || quantity !== undefined || unit !== undefined) {
      const normalized = normalizeInventoryValues({
        quantity: quantity !== undefined ? quantity : item.quantity,
        cost: cost !== undefined ? cost : item.cost,
        unit: unit !== undefined ? unit : item.unit,
      });

      item.cost = normalized.cost;
      item.quantity = normalized.quantity;
      item.unit = normalized.unit;
    }

    if (req.file) {
      item.image = buildImagePath(req.file.filename);
    }

    await item.save();

    return res.status(200).json({
      success: true,
      message: "Item updated successfully",
      data: item,
    });
  } catch (error) {
    console.error("updateItem error:", error);
    return res.status(500).json({
      success: false,
      message: getErrorMessage(error),
    });
  }
};

exports.addQuantity = async (req, res) => {
  try {
    await migrateLegacyInventoryUnits();

    const { id } = req.params;
    const { quantityToAdd } = req.body;

    const item = await InventoryItem.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    const parsedQuantity = Number(quantityToAdd);

    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity to add must be greater than 0",
      });
    }

    item.quantity += parsedQuantity;
    await item.save();

    return res.status(200).json({
      success: true,
      message: "Quantity updated successfully",
      data: item,
    });
  } catch (error) {
    console.error("addQuantity error:", error);
    return res.status(500).json({
      success: false,
      message: getErrorMessage(error),
    });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await InventoryItem.findByIdAndDelete(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Item deleted successfully",
    });
  } catch (error) {
    console.error("deleteItem error:", error);
    return res.status(500).json({
      success: false,
      message: getErrorMessage(error),
    });
  }
};
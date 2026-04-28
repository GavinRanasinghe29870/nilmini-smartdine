const Category = require("../models/category.model");
const Product = require("../models/product.model");

function normalizeImagePath(image = "") {
  const value = String(image || "").trim();

  if (!value) {
    return "";
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const url = new URL(value);
      return url.pathname || "";
    } catch {
      return value;
    }
  }

  if (value.startsWith("uploads/")) {
    return `/${value}`;
  }

  return value;
}

function escapeRegExp(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mapCategory(category, count = 0) {
  return {
    id: String(category._id),
    name: category.name,
    description: category.description || "",
    icon: category.icon || "Grid3x3",
    image: normalizeImagePath(category.image),
    count,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 }).lean();

    const counts = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    const countMap = new Map(
      counts.map((item) => [String(item._id), item.count])
    );

    const data = categories.map((category) =>
      mapCategory(category, countMap.get(String(category._id)) || 0)
    );

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("getCategories error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description = "", image = "", icon = "Grid3x3" } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const trimmedName = String(name).trim();

    const existing = await Category.findOne({
      name: {
        $regex: `^${escapeRegExp(trimmedName)}$`,
        $options: "i",
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    const category = await Category.create({
      name: trimmedName,
      description: String(description || "").trim(),
      image: normalizeImagePath(image),
      icon: String(icon || "Grid3x3").trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: mapCategory(category, 0),
    });
  } catch (error) {
    console.error("createCategory error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create category",
    });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description = "", image = "", icon } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const trimmedName = String(name).trim();

    const duplicate = await Category.findOne({
      _id: { $ne: id },
      name: {
        $regex: `^${escapeRegExp(trimmedName)}$`,
        $options: "i",
      },
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Category name already exists",
      });
    }

    category.name = trimmedName;
    category.description = String(description || "").trim();
    category.image = normalizeImagePath(image);

    if (icon !== undefined) {
      category.icon = String(icon || "Grid3x3").trim();
    }

    await category.save();

    const count = await Product.countDocuments({ category: category._id });

    return res.json({
      success: true,
      message: "Category updated successfully",
      data: mapCategory(category, count),
    });
  } catch (error) {
    console.error("updateCategory error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update category",
    });
  }
};
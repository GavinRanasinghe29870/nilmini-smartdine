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

function sanitizeIngredients(ingredients = []) {
  if (!Array.isArray(ingredients)) return [];

  return ingredients
    .filter((item) => item && String(item.name || "").trim())
    .map((item) => ({
      name: String(item.name || "").trim(),
      quantity: String(item.quantity || "").trim(),
      unit: String(item.unit || "g").trim() || "g",
    }));
}

function mapProduct(product) {
  return {
    id: String(product._id),
    name: product.name,
    description: product.description || "",
    itemId: product.itemId,
    categoryId:
      product.category && product.category._id
        ? String(product.category._id)
        : String(product.category),
    categoryName:
      product.category && product.category.name ? product.category.name : "",
    price: product.price,
    availability: product.availability,
    image: normalizeImagePath(product.image),
    ingredients: product.ingredients || [],
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

async function generateItemId() {
  while (true) {
    const itemId = `#${Date.now().toString().slice(-8)}${Math.floor(
      100 + Math.random() * 900
    )}`;

    const exists = await Product.exists({ itemId });
    if (!exists) return itemId;
  }
}

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        path: `/uploads/${req.file.filename}`,
      },
    });
  } catch (error) {
    console.error("uploadImage error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload image",
    });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: products.map(mapProduct),
    });
  } catch (error) {
    console.error("getProducts error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      categoryId,
      description = "",
      price,
      image = "",
      availability = "In Stock",
      ingredients = [],
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    if (price === undefined || price === null || Number(price) < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid price is required",
      });
    }

    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Selected category not found",
      });
    }

    const product = await Product.create({
      name: String(name).trim(),
      description: String(description || "").trim(),
      itemId: await generateItemId(),
      category: category._id,
      price: Number(price),
      availability:
        availability === "Out of Stock" ? "Out of Stock" : "In Stock",
      image: normalizeImagePath(image),
      ingredients: sanitizeIngredients(ingredients),
    });

    await product.populate("category", "name");

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: mapProduct(product),
    });
  } catch (error) {
    console.error("createProduct error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create product",
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      categoryId,
      description = "",
      price,
      image = "",
      availability = "In Stock",
      ingredients = [],
    } = req.body;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    if (price === undefined || price === null || Number(price) < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid price is required",
      });
    }

    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Selected category not found",
      });
    }

    product.name = String(name).trim();
    product.description = String(description || "").trim();
    product.category = category._id;
    product.price = Number(price);
    product.availability =
      availability === "Out of Stock" ? "Out of Stock" : "In Stock";
    product.image = normalizeImagePath(image);
    product.ingredients = sanitizeIngredients(ingredients);

    await product.save();
    await product.populate("category", "name");

    return res.json({
      success: true,
      message: "Product updated successfully",
      data: mapProduct(product),
    });
  } catch (error) {
    console.error("updateProduct error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("deleteProduct error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
};
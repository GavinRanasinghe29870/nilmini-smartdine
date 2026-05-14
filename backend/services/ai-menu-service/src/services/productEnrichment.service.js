const axios = require("axios");

const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || "http://localhost:5004";

async function getProductsFromProductService() {
  const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/products`, {
    timeout: 60000,
  });

  return response.data.data || [];
}

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getProductType(product) {
  const type = String(product?.productType || "").trim();

  if (
    ["prepared_food", "beverage", "retail_stock", "non_menu_item"].includes(
      type
    )
  ) {
    return type;
  }

  return "prepared_food";
}

async function enrichPredictionsWithProducts(predictions) {
  const products = await getProductsFromProductService();

  const productMap = new Map();

  for (const product of products) {
    productMap.set(normalizeName(product.name), product);
  }

  const warnings = [];

  const enriched = predictions.map((prediction) => {
    const product = productMap.get(normalizeName(prediction.productName));

    if (!product) {
      warnings.push(
        `Product '${prediction.productName}' was predicted but was not found in Product collection.`
      );

      return {
        ...prediction,
        productId: "",
        itemId: "",
        productDbName: "",
        productImage: "",
        categoryName: "",
        price: 0,
        availability: "In Stock",
        productType: "prepared_food",
        includeInAiMenu: true,
        ingredients: [],
        productFound: false,
      };
    }

    return {
      ...prediction,
      productId: product.id || "",
      itemId: product.itemId || "",
      productDbName: product.name || "",
      productImage: product.image || "",
      categoryName: product.categoryName || "",
      price: Number(product.price || 0),
      availability: product.availability || "In Stock",
      productType: getProductType(product),
      includeInAiMenu:
        typeof product.includeInAiMenu === "boolean"
          ? product.includeInAiMenu
          : true,
      ingredients: Array.isArray(product.ingredients)
        ? product.ingredients
        : [],
      productFound: true,
    };
  });

  return {
    enriched,
    warnings,
  };
}

function getMenuEligibleItems(items) {
  return items.filter((item) => {
    if (item.includeInAiMenu === false) return false;
    if (item.productType === "non_menu_item") return false;
    return true;
  });
}

module.exports = {
  enrichPredictionsWithProducts,
  getMenuEligibleItems,
};
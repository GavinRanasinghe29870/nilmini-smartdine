const axios = require("axios");

const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || "http://localhost:5004";

async function getProductsFromProductService() {
  const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/products`, {
    timeout: 60000,
  });

  const payload = response.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.products)) return payload.products;
  if (Array.isArray(payload?.data?.products)) return payload.data.products;

  return [];
}

function normalizeImagePath(image = "") {
  const value = String(image || "").trim();

  if (!value) return "";

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

function compactText(value) {
  return normalizeText(value).replace(/\s+/g, "");
}

function getDynamicMatchKeys(value) {
  const normalized = normalizeText(value);
  const compact = compactText(value);

  const keys = new Set();

  if (!normalized) return keys;

  keys.add(normalized);

  if (compact) {
    keys.add(compact);
  }

  return keys;
}

function getProductName(product) {
  return (
    product.name ||
    product.productName ||
    product.title ||
    product.itemName ||
    ""
  );
}

function getProductId(product) {
  return String(product.id || product._id || product.productId || "");
}

function getProductItemId(product) {
  return String(
    product.itemId ||
      product.itemID ||
      product.itemCode ||
      product.code ||
      product.sku ||
      ""
  );
}

function getCategoryName(product) {
  if (typeof product.categoryName === "string") {
    return product.categoryName;
  }

  if (typeof product.category === "string") {
    return product.category;
  }

  if (product.category?.name) {
    return product.category.name;
  }

  if (product.categoryId?.name) {
    return product.categoryId.name;
  }

  return "";
}

function getProductImage(product) {
  return normalizeImagePath(
    product.image ||
      product.productImage ||
      product.imageUrl ||
      product.photo ||
      ""
  );
}

function getProductType(product) {
  return product?.productType || "prepared_food";
}

function buildProductMap(products = []) {
  const productMap = new Map();

  for (const product of products) {
    const productName = getProductName(product);
    const itemId = getProductItemId(product);

    for (const key of getDynamicMatchKeys(productName)) {
      if (!productMap.has(key)) {
        productMap.set(key, product);
      }
    }

    for (const key of getDynamicMatchKeys(itemId)) {
      if (!productMap.has(key)) {
        productMap.set(key, product);
      }
    }
  }

  return productMap;
}

function findProduct(productMap, predictionProductName) {
  for (const key of getDynamicMatchKeys(predictionProductName)) {
    const product = productMap.get(key);

    if (product) {
      return product;
    }
  }

  return null;
}

async function enrichPredictionsWithProducts(predictions = []) {
  const products = await getProductsFromProductService();
  const productMap = buildProductMap(products);

  const warnings = [];

  const enriched = predictions.map((prediction) => {
    const product = findProduct(productMap, prediction.productName);

    if (!product) {
      warnings.push(
        `Product '${prediction.productName}' was predicted by the ML model but was not found in Product collection. Menu generation continued without product image/category/price/itemId/ingredients.`
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

        /*
          Product DB should not filter prediction items.
          Product table is only used to attach display/details data.
        */
        includeInAiMenu: true,

        ingredients: [],
        productFound: false,
      };
    }

    return {
      ...prediction,

      productId: getProductId(product),
      itemId: getProductItemId(product),
      productDbName: getProductName(product),

      /*
        Keep ML product name as main productName.
        This avoids breaking prediction names.
      */
      productName: prediction.productName,

      productImage: getProductImage(product),
      categoryName: getCategoryName(product),
      price: Number(product.price || product.unitPrice || 0),
      availability: product.availability || product.status || "In Stock",

      productType: getProductType(product),

      /*
        Keep previous menu generation behavior.
        Product DB is not used to block ML predicted menu items.
      */
      includeInAiMenu: true,

      ingredients: Array.isArray(product.ingredients)
        ? product.ingredients
        : [],

      productFound: true,
    };
  });

  return {
    enriched,
    warnings,
    productCount: products.length,
  };
}

function getMenuEligibleItems(items = []) {
  /*
    Keep previous behavior:
    generate menu from every ML predicted item.
    Product collection only attaches image/itemId/category/price/ingredients.
  */
  return items;
}

module.exports = {
  enrichPredictionsWithProducts,
  getMenuEligibleItems,
};
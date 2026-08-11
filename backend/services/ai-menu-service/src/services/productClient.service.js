//small reusable client for fetching products from the product service


const axios = require("axios");

const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || "http://localhost:5004";

async function getProductsFromProductService() {
  const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/products`, {
    timeout: 60000,
  });

  return response.data.data || [];
}

module.exports = {
  getProductsFromProductService,
};
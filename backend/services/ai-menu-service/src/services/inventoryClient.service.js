const axios = require("axios");

const INVENTORY_SERVICE_URL =
  process.env.INVENTORY_SERVICE_URL || "http://localhost:5003";

async function getInventoryItemsFromInventoryService() {
  const response = await axios.get(`${INVENTORY_SERVICE_URL}/api/inventory`, {
    timeout: 60000,
  });

  return response.data.data || [];
}

module.exports = {
  getInventoryItemsFromInventoryService,
};
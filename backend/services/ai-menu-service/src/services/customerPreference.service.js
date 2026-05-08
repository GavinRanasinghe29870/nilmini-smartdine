const axios = require("axios");
const { addDays } = require("./date.service");

const CUSTOMER_PREFERENCE_API_URL =
  process.env.CUSTOMER_PREFERENCE_API_URL || "http://localhost:8002";

function getAxiosErrorMessage(error) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (detail?.message) {
    return detail.message;
  }

  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error.message ||
    "Customer preference API request failed"
  );
}

async function updateCustomerDatasetsFromOrders({ predictionDate }) {
  const salesDate = addDays(predictionDate, -1);

  const response = await axios.post(
    `${CUSTOMER_PREFERENCE_API_URL}/data/customer-datasets/upsert-from-orders`,
    {
      start_date: salesDate,
      end_date: salesDate,
    },
    {
      timeout: 180000,
    }
  );

  return response.data;
}

async function rebuildCustomerPreferenceRankings() {
  const response = await axios.post(
    `${CUSTOMER_PREFERENCE_API_URL}/data/preferences/rebuild`,
    {},
    {
      timeout: 180000,
    }
  );

  return response.data;
}

async function getCustomerMenuPreference({
  predictionDate,
  weatherType = "Normal",
  holiday = "No",
  monthPeriod,
  topN = 8,
}) {
  let datasetUpdate = null;
  let preferenceRebuild = null;

  try {
    datasetUpdate = await updateCustomerDatasetsFromOrders({
      predictionDate,
    });
  } catch (error) {
    datasetUpdate = {
      success: false,
      skipped: true,
      message: getAxiosErrorMessage(error),
    };
  }

  try {
    preferenceRebuild = await rebuildCustomerPreferenceRankings();
  } catch (error) {
    preferenceRebuild = {
      success: false,
      skipped: true,
      message: getAxiosErrorMessage(error),
    };
  }

  const response = await axios.post(
    `${CUSTOMER_PREFERENCE_API_URL}/predict/customer-menu-preference`,
    {
      prediction_date: predictionDate,
      weather_type: weatherType,
      holiday,
      month_period: monthPeriod,
      top_n: topN,
    },
    {
      timeout: 60000,
    }
  );

  return {
    ...response.data,
    datasetUpdate,
    preferenceRebuild,
  };
}

module.exports = {
  getCustomerMenuPreference,
  updateCustomerDatasetsFromOrders,
  rebuildCustomerPreferenceRankings,
};
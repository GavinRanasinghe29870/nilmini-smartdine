const axios = require("axios");

function normalizePrediction(item) {
  return {
    productName: item.productName || item.product_name,
    predictedQuantity: Number(item.predictedQuantity || item.predicted_units || 0),
    predictionType: item.predictionType || item.prediction_type || "unknown",
    evaluationLane: item.evaluationLane || item.evaluation_lane || "unknown",
    reliability: item.reliability || "Review",
    testMape: item.testMape || item.test_mape || null,
    testWmape: item.testWmape || item.test_wmape || null,
  };
}

function cleanBaseUrl(url) {
  return String(url || "").replace(/\/+$/, "");
}

const getNextDayPredictions = async ({ predictionDate, weatherType, holiday }) => {
  const mlApiUrl = cleanBaseUrl(process.env.ML_API_URL || "http://ml-api:8001");

  try {
    const response = await axios.post(
      `${mlApiUrl}/predict/next-day-all`,
      {
        prediction_date: predictionDate,
        weather_type: weatherType || "Normal",
        holiday: holiday || "No",
      },
      {
        timeout: 60000,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const rawPredictions =
      response.data.predictions ||
      response.data.results ||
      response.data.data ||
      [];

    return {
      predictionDate: response.data.prediction_date || predictionDate,
      predictions: rawPredictions.map(normalizePrediction),
    };
  } catch (error) {
    if (error.response) {
      const details =
        typeof error.response.data === "object"
          ? JSON.stringify(error.response.data)
          : String(error.response.data);

      throw new Error(`ML API error ${error.response.status}: ${details}`);
    }

    if (error.request) {
      throw new Error(
        `Cannot connect to ML API at ${mlApiUrl}. Make sure the ml-api Docker service is running and healthy.`
      );
    }

    throw new Error(`ML prediction request failed: ${error.message}`);
  }
};

module.exports = {
  getNextDayPredictions,
};
const axios = require("axios");
const { getMonthPeriod } = require("./date.service");

const ML_API_URL = process.env.ML_API_URL || "http://localhost:8001";

async function getLivePredictions({
  predictionDate,
  weatherType = "Normal",
  holiday = "No",
  beforeHolidayFlag = "No",
  afterHolidayFlag = "No",
  monthPeriod,
}) {
  const finalMonthPeriod = monthPeriod || getMonthPeriod(predictionDate);

  const response = await axios.post(
    `${ML_API_URL}/predict/next-day-all`,
    {
      prediction_date: predictionDate,
      weather_type: weatherType,
      holiday,
      before_holiday_flag: beforeHolidayFlag,
      after_holiday_flag: afterHolidayFlag,
      month_period: finalMonthPeriod,
    },
    {
      timeout: 120000,
    }
  );

  const predictions = response.data.predictions || [];

  return predictions.map((item) => ({
    productName: item.productName,
    predictedQuantity: Number(item.predictedQuantity || 0),
    predictionType: item.predictionType || "unknown",
    evaluationLane: item.evaluationLane || "unknown",
    reliability: item.reliability || "Review",
    testMape: item.testMape ?? null,
    testWmape: item.testWmape ?? null,
  }));
}

async function getNextDayPredictions({
  predictionDate,
  weatherType = "Normal",
  holiday = "No",
  beforeHolidayFlag = "No",
  afterHolidayFlag = "No",
  monthPeriod,
}) {
  const predictions = await getLivePredictions({
    predictionDate,
    weatherType,
    holiday,
    beforeHolidayFlag,
    afterHolidayFlag,
    monthPeriod,
  });

  return {
    success: true,
    predictions,
  };
}

module.exports = {
  getLivePredictions,
  getNextDayPredictions,
};
const axios = require("axios");
const { addDays, getMonthPeriod } = require("./date.service");

const ML_API_URL = process.env.ML_API_URL || "http://localhost:8001";
const ORDER_SERVICE_URL =
  process.env.ORDER_SERVICE_URL || "http://localhost:5006";

async function getDailySalesRows(date) {
  const response = await axios.get(
    `${ORDER_SERVICE_URL}/api/orders/daily-sales`,
    {
      params: {
        startDate: date,
        endDate: date,
      },
      timeout: 60000,
    }
  );

  return response.data.data || [];
}

function buildProductTotalsFromSalesRows(rows) {
  const totals = {};

  for (const row of rows) {
    const productName = String(row.productName || "").trim();

    if (!productName) continue;

    totals[productName] =
      (totals[productName] || 0) + Number(row.totalQuantity || 0);
  }

  return totals;
}

async function updateWideCsvWithDailySales({
  salesDate,
  weatherType = "Normal",
  holiday = "No",
  beforeHolidayFlag = "No",
  afterHolidayFlag = "No",
  monthPeriod,
}) {
  const rows = await getDailySalesRows(salesDate);
  const productTotals = buildProductTotalsFromSalesRows(rows);

  if (Object.keys(productTotals).length === 0) {
    return {
      success: false,
      skipped: true,
      message: `No daily sales found for ${salesDate}. CSV was not updated.`,
      productTotals: {},
    };
  }

  const response = await axios.post(
    `${ML_API_URL}/data/wide-csv/upsert-day-sales`,
    {
      date: salesDate,
      weather_type: weatherType,
      holiday,
      before_holiday_flag: beforeHolidayFlag,
      after_holiday_flag: afterHolidayFlag,
      month_period: monthPeriod || getMonthPeriod(salesDate),
      product_totals: productTotals,
    },
    {
      timeout: 60000,
    }
  );

  return response.data;
}

async function getLivePredictions({
  predictionDate,
  weatherType = "Normal",
  holiday = "No",
  beforeHolidayFlag = "No",
  afterHolidayFlag = "No",
  monthPeriod,
}) {
  const salesDate = addDays(predictionDate, -1);
  const finalMonthPeriod = monthPeriod || getMonthPeriod(predictionDate);

  await updateWideCsvWithDailySales({
    salesDate,
    weatherType,
    holiday,
    beforeHolidayFlag,
    afterHolidayFlag,
    monthPeriod: getMonthPeriod(salesDate),
  });

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
  updateWideCsvWithDailySales,
};
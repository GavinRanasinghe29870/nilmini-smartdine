const { buildSalesReport } = require("../services/salesReport.service");

exports.getSalesReport = async (req, res, next) => {
  try {
    if (typeof buildSalesReport !== "function") {
      throw new Error(
        "buildSalesReport is not exported correctly from salesReport.service.js"
      );
    }

    const {
      startDate,
      endDate,
      search = "",
      sortBy = "date",
      sortOrder = "desc",
      ageGroup = "",
      weather = "",
      holiday = "",
    } = req.query;

    const report = await buildSalesReport({
      startDate,
      endDate,
      search,
      sortBy,
      sortOrder,
      ageGroup,
      weather,
      holiday,
    });

    return res.status(200).json(report);
  } catch (error) {
    next(error);
  }
};
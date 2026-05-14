const { buildRevenueReport } = require("../services/revenueReport.service");

exports.getRevenueReport = async (req, res, next) => {
  try {
    if (typeof buildRevenueReport !== "function") {
      throw new Error(
        "buildRevenueReport is not exported correctly from revenueReport.service.js"
      );
    }

    const {
      startDate,
      endDate,
      search = "",
      sortBy = "date",
      sortOrder = "desc",
    } = req.query;

    const report = await buildRevenueReport({
      startDate,
      endDate,
      search,
      sortBy,
      sortOrder,
    });

    return res.status(200).json(report);
  } catch (error) {
    next(error);
  }
};
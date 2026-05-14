const { buildDashboardReport } = require("../services/dashboardReport.service");

exports.getDashboardReport = async (req, res, next) => {
  try {
    const report = await buildDashboardReport();
    return res.status(200).json(report);
  } catch (error) {
    next(error);
  }
};
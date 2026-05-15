const { buildStaffReport } = require("../services/staffReport.service");

exports.getStaffReport = async (req, res, next) => {
  try {
    if (typeof buildStaffReport !== "function") {
      throw new Error(
        "buildStaffReport is not exported correctly from staffReport.service.js"
      );
    }

    const {
      startDate,
      endDate,
      search = "",
      sortBy = "fullName",
      sortOrder = "asc",
      role = "",
    } = req.query;

    const report = await buildStaffReport({
      startDate,
      endDate,
      search,
      sortBy,
      sortOrder,
      role,
      cookie: req.headers.cookie || "",
    });

    return res.status(200).json(report);
  } catch (error) {
    next(error);
  }
};
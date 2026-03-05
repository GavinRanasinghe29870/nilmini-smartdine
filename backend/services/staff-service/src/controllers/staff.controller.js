const authStaffService = require("../services/authStaff.service");

exports.createUser = async (req, res) => {
  try {
    const cookie = req.headers.cookie || "";
    const payload = req.body;

    const data = await authStaffService.createStaff({ cookie, payload });
    return res.status(201).json(data);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message || "Server error" });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const cookie = req.headers.cookie || "";

    const data = await authStaffService.getStaffList({ cookie });
    return res.json(data);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message || "Server error" });
  }
};
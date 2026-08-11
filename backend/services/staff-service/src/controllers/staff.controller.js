const authStaffService = require("../services/authStaff.service");

function buildStaffPayload(req) {
  const payload = {
    ...req.body,
  };

  if (req.file) {
    payload.image = `/uploads/${req.file.filename}`;
  }

  return payload;
}

exports.createUser = async (req, res) => {
  try {
    const cookie = req.headers.cookie || "";
    const payload = buildStaffPayload(req);

    const data = await authStaffService.createStaff({ cookie, payload });

    return res.status(201).json(data);
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Server error",
    });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const cookie = req.headers.cookie || "";

    const data = await authStaffService.getStaffList({ cookie });

    return res.json(data);
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Server error",
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const cookie = req.headers.cookie || "";
    const id = req.params.id;

    const data = await authStaffService.getStaffById({ cookie, id });

    return res.json(data);
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Server error",
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const cookie = req.headers.cookie || "";
    const id = req.params.id;
    const payload = buildStaffPayload(req);

    const data = await authStaffService.updateStaff({ cookie, id, payload });

    return res.json(data);
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Server error",
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const cookie = req.headers.cookie || "";
    const id = req.params.id;

    const data = await authStaffService.deleteStaff({ cookie, id });

    return res.json(data);
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Server error",
    });
  }
};

exports.getMe = async (req, res) => {
  return res.json({ tokenUser: req.user });
};
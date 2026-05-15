const bcrypt = require("bcryptjs");
const User = require("../models/user.model");

const ALLOWED_ROLES = ["OWNER", "MANAGER", "CASHIER", "WAITER", "STAFF"];

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function serializeUser(user) {
  return {
    id: String(user._id),
    _id: String(user._id),
    fullName: user.fullName || "",
    email: user.email || "",
    username: user.username || "",
    role: user.role,
    phone: user.phone || "",
    salary: user.salary || 0,
    dob: user.dob ? user.dob.toISOString().slice(0, 10) : "",
    shiftStart: user.shiftStart || "",
    shiftEnd: user.shiftEnd || "",
    address: user.address || "",
    additionalDetails: user.additionalDetails || "",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

exports.createUser = async (req, res) => {
  try {
    const {
      fullName,
      email,
      username,
      password,
      role,
      phone,
      salary,
      dob,
      shiftStart,
      shiftEnd,
      address,
      additionalDetails,
    } = req.body;

    if (!fullName || !String(fullName).trim()) {
      return res.status(400).json({ message: "fullName is required" });
    }

    if (!password) {
      return res.status(400).json({ message: "password is required" });
    }

    const finalRole = role || "STAFF";

    if (!ALLOWED_ROLES.includes(finalRole)) {
      return res.status(400).json({
        message: `Invalid role. Allowed: ${ALLOWED_ROLES.join(", ")}`,
      });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    if (email) {
      const emailExists = await User.findOne({
        email: email.toLowerCase().trim(),
      });

      if (emailExists) {
        return res.status(409).json({ message: "Email already exists" });
      }
    }

    if (username) {
      const userExists = await User.findOne({
        username: username.trim(),
      });

      if (userExists) {
        return res.status(409).json({ message: "Username already exists" });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({
      fullName: fullName.trim(),
      email: email ? email.toLowerCase().trim() : undefined,
      username: username ? username.trim() : undefined,
      password: hashed,
      role: finalRole,
      phone: phone || "",
      salary: Number(salary || 0),
      dob: dob ? new Date(dob) : undefined,
      shiftStart: shiftStart || "",
      shiftEnd: shiftEnd || "",
      address: address || "",
      additionalDetails: additionalDetails || "",
    });

    return res.status(201).json({
      message: "User created",
      user: serializeUser(user),
    });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.json(users.map(serializeUser));
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    return res.json(serializeUser(user));
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};
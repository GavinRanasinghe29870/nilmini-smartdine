const bcrypt = require("bcryptjs");
const User = require("../models/user.model");

const ALLOWED_ROLES = ["OWNER", "MANAGER", "CASHIER", "WAITER", "STAFF"];
const PROTECTED_ROLES = ["OWNER", "MANAGER"];

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isManager(req) {
  return req.user?.role === "MANAGER";
}

function isProtectedRole(role) {
  return PROTECTED_ROLES.includes(role);
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
    image: user.image || "",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function cleanOptionalString(value) {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

async function validateEmailForUser(email, currentUserId = null) {
  const cleanEmail = cleanOptionalString(email);

  if (!cleanEmail) return undefined;

  if (!isValidEmail(cleanEmail)) {
    const error = new Error("Invalid email format");
    error.statusCode = 400;
    throw error;
  }

  const existing = await User.findOne({
    email: cleanEmail.toLowerCase(),
    ...(currentUserId ? { _id: { $ne: currentUserId } } : {}),
  });

  if (existing) {
    const error = new Error("Email already exists");
    error.statusCode = 409;
    throw error;
  }

  return cleanEmail.toLowerCase();
}

async function validateUsernameForUser(username, currentUserId = null) {
  const cleanUsername = cleanOptionalString(username);

  if (!cleanUsername) return undefined;

  const existing = await User.findOne({
    username: cleanUsername,
    ...(currentUserId ? { _id: { $ne: currentUserId } } : {}),
  });

  if (existing) {
    const error = new Error("Username already exists");
    error.statusCode = 409;
    throw error;
  }

  return cleanUsername;
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
      image,
    } = req.body;

    if (!fullName || !String(fullName).trim()) {
      return res.status(400).json({ message: "Full name is required" });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const finalRole = role || "STAFF";

    if (!ALLOWED_ROLES.includes(finalRole)) {
      return res.status(400).json({
        message: `Invalid role. Allowed: ${ALLOWED_ROLES.join(", ")}`,
      });
    }

    if (isManager(req) && isProtectedRole(finalRole)) {
      return res.status(403).json({
        message: "Managers cannot create Owner or Manager staff accounts",
      });
    }

    const cleanEmail = await validateEmailForUser(email);
    const cleanUsername = await validateUsernameForUser(username);

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({
      fullName: String(fullName).trim(),
      email: cleanEmail,
      username: cleanUsername,
      password: hashed,
      role: finalRole,
      phone: phone || "",
      salary: Number(salary || 0),
      dob: dob ? new Date(dob) : undefined,
      shiftStart: shiftStart || "",
      shiftEnd: shiftEnd || "",
      address: address || "",
      additionalDetails: additionalDetails || "",
      image: image || "",
    });

    return res.status(201).json({
      message: "User created",
      user: serializeUser(user),
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      message: err.message || "Server error",
    });
  }
};

exports.listUsers = async (_req, res) => {
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

exports.updateUser = async (req, res) => {
  try {
    const staffId = req.params.id;
    const user = await User.findById(staffId);

    if (!user) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    if (isManager(req) && isProtectedRole(user.role)) {
      return res.status(403).json({
        message: "Managers cannot edit Owner or Manager staff accounts",
      });
    }

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
      image,
    } = req.body;

    if (role !== undefined) {
      if (!ALLOWED_ROLES.includes(role)) {
        return res.status(400).json({
          message: `Invalid role. Allowed: ${ALLOWED_ROLES.join(", ")}`,
        });
      }

      if (isManager(req) && isProtectedRole(role)) {
        return res.status(403).json({
          message: "Managers cannot assign Owner or Manager roles",
        });
      }

      user.role = role;
    }

    if (fullName !== undefined) {
      if (!String(fullName).trim()) {
        return res.status(400).json({ message: "Full name is required" });
      }

      user.fullName = String(fullName).trim();
    }

    if (email !== undefined) {
      user.email = await validateEmailForUser(email, staffId);
    }

    if (username !== undefined) {
      user.username = await validateUsernameForUser(username, staffId);
    }

    if (password !== undefined && String(password).trim()) {
      if (password.length < 8) {
        return res.status(400).json({
          message: "Password must be at least 8 characters",
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      user.tokenVersion = Number(user.tokenVersion || 0) + 1;
    }

    if (phone !== undefined) user.phone = phone || "";
    if (salary !== undefined) user.salary = Number(salary || 0);
    if (dob !== undefined) user.dob = dob ? new Date(dob) : undefined;
    if (shiftStart !== undefined) user.shiftStart = shiftStart || "";
    if (shiftEnd !== undefined) user.shiftEnd = shiftEnd || "";
    if (address !== undefined) user.address = address || "";
    if (additionalDetails !== undefined) {
      user.additionalDetails = additionalDetails || "";
    }
    if (image !== undefined) user.image = image || "";

    await user.save();

    return res.json({
      message: "User updated",
      user: serializeUser(user),
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      message: err.message || "Server error",
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const staffId = req.params.id;
    const user = await User.findById(staffId);

    if (!user) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    if (String(req.user?.sub) === String(user._id)) {
      return res.status(400).json({
        message: "You cannot delete your own account",
      });
    }

    if (isManager(req) && isProtectedRole(user.role)) {
      return res.status(403).json({
        message: "Managers cannot delete Owner or Manager staff accounts",
      });
    }

    await User.findByIdAndDelete(staffId);

    return res.json({
      message: "User deleted",
      user: serializeUser(user),
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      message: err.message || "Server error",
    });
  }
};
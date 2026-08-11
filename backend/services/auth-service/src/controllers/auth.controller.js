const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { redis } = require("../config/redis");
const User = require("../models/user.model");
const { signAccessToken, signRefreshToken } = require("../utils/tokens");

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

function clearAuthCookies(res) {
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
}

function cleanString(value) {
  return String(value || "").trim();
}

function normalizePhone(value) {
  return cleanString(value).replace(/[^0-9+]/g, "");
}

function createTemporaryPassword() {
  return `Nilmini@${crypto.randomInt(100000, 999999)}`;
}

exports.login = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    const query = String(emailOrUsername).trim();

    const user = await User.findOne({
      $or: [{ email: query.toLowerCase() }, { username: query }],
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.password);

    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const sid = crypto.randomUUID();

    await redis.set(`session:${sid}`, String(user._id), "EX", 60 * 60 * 24 * 7);

    const accessToken = signAccessToken(user, sid);
    const refreshToken = signRefreshToken(user, sid);

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      message: "Login successful",
      user: {
        id: String(user._id),
        role: user.role,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
      },
    });
  } catch (e) {
    console.error("LOGIN ERROR:", e);
    return res.status(500).json({ message: e.message || "Server error" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const email = cleanString(req.body?.email).toLowerCase();
    const phone = cleanString(req.body?.phone);
    const username = cleanString(req.body?.username);

    if (!email || !phone || !username) {
      return res.status(400).json({
        message: "Email, phone number, and username are required",
      });
    }

    const user = await User.findOne({
      email,
      username,
    });

    if (!user || normalizePhone(user.phone) !== normalizePhone(phone)) {
      return res.status(404).json({
        message:
          "No matching account found. Please check the email, phone number, and username.",
      });
    }

    const temporaryPassword = createTemporaryPassword();
    const salt = await bcrypt.genSalt(10);

    user.password = await bcrypt.hash(temporaryPassword, salt);
    user.tokenVersion = Number(user.tokenVersion || 0) + 1;

    await user.save();

    return res.json({
      message:
        "Account details matched. A temporary password was created successfully.",
      temporaryPassword,
    });
  } catch (e) {
    console.error("FORGOT PASSWORD ERROR:", e);
    return res.status(500).json({ message: e.message || "Server error" });
  }
};

exports.verify = async (req, res) => {
  return res.json({
    user: {
      id: req.user.sub,
      role: req.user.role,
      email: req.user.email,
      username: req.user.username,
      fullName: req.user.fullName,
    },
  });
};

exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Missing refresh token" });
    }

    const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    if (payload.type !== "refresh" || !payload.sid) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const sessionUserId = await redis.get(`session:${payload.sid}`);

    if (!sessionUserId || String(sessionUserId) !== String(payload.sub)) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Session revoked" });
    }

    const user = await User.findById(sessionUserId);

    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "User not found" });
    }

    if ((user.tokenVersion ?? 0) !== (payload.tokenVersion ?? 0)) {
      await redis.del(`session:${payload.sid}`);
      clearAuthCookies(res);
      return res.status(401).json({ message: "Session revoked" });
    }

    const newAccess = signAccessToken(user, payload.sid);

    res.cookie("accessToken", newAccess, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    return res.json({ message: "Token refreshed" });
  } catch {
    clearAuthCookies(res);
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};

exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    const accessToken = req.cookies?.accessToken;

    let sessionId = null;

    if (refreshToken) {
      try {
        const payload = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET
        );

        if (payload?.sid) {
          sessionId = payload.sid;
        }
      } catch {
      }
    }

    if (!sessionId && accessToken) {
      try {
        const payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

        if (payload?.sid) {
          sessionId = payload.sid;
        }
      } catch {
      }
    }

    if (sessionId) {
      await redis.del(`session:${sessionId}`);
    }

    clearAuthCookies(res);

    return res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (e) {
    clearAuthCookies(res);

    return res.status(500).json({
      message: e.message || "Logout failed",
    });
  }
};
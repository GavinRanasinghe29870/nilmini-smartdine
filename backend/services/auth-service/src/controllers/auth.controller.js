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

    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const sid = crypto.randomUUID();

    if (!redis) {
      return res.status(500).json({ message: "Redis not initialized" });
    }

    await redis.set(`session:${sid}`, String(user._id), "EX", 60 * 60 * 24 * 7);

    const accessToken = signAccessToken(user, sid);
    const refreshToken = signRefreshToken(user, sid);

    res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    return res.json({
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

exports.verify = async (req, res) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) return res.status(401).json({ message: "Missing access token" });

    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (payload.type !== "access") return res.status(401).json({ message: "Invalid token type" });

    if (payload.sid) {
      const exists = await redis.get(`session:${payload.sid}`);
      if (!exists) return res.status(401).json({ message: "Session revoked" });
    }

    return res.json({
      user: {
        id: payload.sub,
        role: payload.role,
        email: payload.email,
        username: payload.username,
        fullName: payload.fullName,
      },
    });
  } catch (e) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: "Missing refresh token" });

    const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const userId = await redis.get(`session:${payload.sid}`);
    if (!userId) return res.status(401).json({ message: "Session revoked" });

    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ message: "User not found" });

    const newAccess = signAccessToken(user, payload.sid);

    res.cookie("accessToken", newAccess, { ...cookieOptions, maxAge: 15 * 60 * 1000 });

    return res.json({ message: "refreshed" });
  } catch (e) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};

exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      try {
        const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        if (payload.sid) await redis.del(`session:${payload.sid}`);
      } catch (_) {}
    }

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    return res.json({ message: "logged out" });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};
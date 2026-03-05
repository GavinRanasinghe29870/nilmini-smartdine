const fetch = require("node-fetch");

const AUTH_BASE = process.env.AUTH_SERVICE_URL; 

async function callAuth(path, { method = "GET", cookie } = {}) {
  const res = await fetch(`${AUTH_BASE}${path}`, {
    method,
    headers: cookie ? { Cookie: cookie } : {},
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }

  return { res, data };
}

async function requireAuth(req, res, next) {
  try {
    if (!AUTH_BASE) {
      return res.status(500).json({ message: "AUTH_SERVICE_URL missing" });
    }

    const cookie = req.headers.cookie || "";

    const { res: verifyRes, data } = await callAuth("/auth/verify", { cookie });

    if (!verifyRes.ok) {
      return res.status(401).json({ message: data?.message || "Unauthorized" });
    }

    req.user = data.user;
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

module.exports = requireAuth;
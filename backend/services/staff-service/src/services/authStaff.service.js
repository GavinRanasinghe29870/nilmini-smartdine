const fetch = require("node-fetch");

const AUTH_BASE = (process.env.AUTH_SERVICE_URL || "http://localhost:5001").replace(/\/$/, "");

async function callAuth(path, { method = "GET", cookie, body } = {}) {
  const res = await fetch(`${AUTH_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();

  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }

  if (!res.ok) {
    const err = new Error(data?.message || "Auth service error");
    err.status = res.status;
    throw err;
  }

  return data;
}

exports.createStaff = ({ cookie, payload }) =>
  callAuth("/api/staff", {
    method: "POST",
    cookie,
    body: payload,
  });

exports.getStaffList = ({ cookie }) =>
  callAuth("/api/staff", {
    method: "GET",
    cookie,
  });

exports.getStaffById = ({ cookie, id }) =>
  callAuth(`/api/staff/${id}`, {
    method: "GET",
    cookie,
  });
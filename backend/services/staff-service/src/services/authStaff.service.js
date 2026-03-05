const fetch = require("node-fetch");
const AUTH_BASE = process.env.AUTH_SERVICE_URL; 

async function callAuth(path, { method = "GET", cookie, body } = {}) {
  if (!AUTH_BASE) throw new Error("AUTH_SERVICE_URL missing in staff-service .env");

  const res = await fetch(`${AUTH_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
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

// auth-service staff endpoints
exports.createStaff = ({ cookie, payload }) =>
  callAuth("/staff", { method: "POST", cookie, body: payload });

exports.getStaffList = ({ cookie }) =>
  callAuth("/staff", { method: "GET", cookie });

exports.getStaffById = ({ cookie, id }) =>
  callAuth(`/staff/${id}`, { method: "GET", cookie });
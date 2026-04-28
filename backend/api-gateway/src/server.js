require("dotenv").config();

const express = require("express");
const cors = require("cors");
const proxy = require("express-http-proxy");
const path = require("path");
const fs = require("fs");

const app = express();

const PORT = process.env.PORT || 5000;

const AUTH = process.env.AUTH_SERVICE_URL || "http://localhost:5001";
const STAFF = process.env.STAFF_SERVICE_URL || "http://localhost:5002";
const INVENTORY = process.env.INVENTORY_SERVICE_URL || "http://localhost:5003";
const PRODUCT = process.env.PRODUCT_SERVICE_URL || "http://localhost:5004";
const AI_MENU = process.env.AI_MENU_SERVICE_URL || "http://localhost:5005";

const FRONTEND = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

const PROXY_TIMEOUT = Number(process.env.PROXY_TIMEOUT || 180000);

/**
 * IMPORTANT:
 * This folder must be the SAME shared uploads folder used by
 * product-service and inventory-service.
 */
const UPLOAD_DIR =
  process.env.UPLOAD_DIR ||
  process.env.FRONTEND_UPLOAD_DIR ||
  path.resolve(process.cwd(), "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

app.use(
  cors({
    origin: FRONTEND,
    credentials: true,
  })
);

/**
 * Browser image URLs should use:
 * http://localhost:5000/uploads/filename.jpg
 */
app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    etag: false,
    maxAge: 0,
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "no-store");
    },
  })
);

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "api-gateway",
    uploadsDir: UPLOAD_DIR,
  });
});

function forwardHeaders(proxyReqOpts, req) {
  proxyReqOpts.headers = proxyReqOpts.headers || {};

  if (req.headers.cookie) {
    proxyReqOpts.headers.cookie = req.headers.cookie;
  }

  if (req.headers.authorization) {
    proxyReqOpts.headers.authorization = req.headers.authorization;
  }

  if (req.headers["content-type"]) {
    proxyReqOpts.headers["content-type"] = req.headers["content-type"];
  }

  return proxyReqOpts;
}

function handleProxyError(serviceName) {
  return (err, res) => {
    console.error(`${serviceName} proxy error:`, err.message);

    if (!res.headersSent) {
      res.status(502).json({
        success: false,
        message: `Gateway failed to reach ${serviceName}`,
        error: err.message,
      });
    }
  };
}

app.use(
  "/api/auth",
  proxy(AUTH, {
    timeout: PROXY_TIMEOUT,
    proxyReqPathResolver: (req) => `/api/auth${req.url}`,
    proxyReqOptDecorator: forwardHeaders,
    proxyErrorHandler: handleProxyError("auth-service"),
    userResHeaderDecorator: (headers) => {
      if (headers["set-cookie"]) {
        headers["set-cookie"] = headers["set-cookie"].map((cookie) =>
          cookie.replace(/;\s*Domain=[^;]+/i, "")
        );
      }

      return headers;
    },
  })
);

app.use(
  "/api/staff",
  proxy(STAFF, {
    timeout: PROXY_TIMEOUT,
    proxyReqPathResolver: (req) => `/api/staff${req.url}`,
    proxyReqOptDecorator: forwardHeaders,
    proxyErrorHandler: handleProxyError("staff-service"),
  })
);

app.use(
  "/api/inventory",
  proxy(INVENTORY, {
    timeout: PROXY_TIMEOUT,
    proxyReqPathResolver: (req) => `/api/inventory${req.url}`,
    proxyReqOptDecorator: forwardHeaders,
    proxyErrorHandler: handleProxyError("inventory-service"),
  })
);

app.use(
  "/api/products",
  proxy(PRODUCT, {
    timeout: PROXY_TIMEOUT,
    proxyReqPathResolver: (req) => `/api/products${req.url}`,
    proxyReqOptDecorator: forwardHeaders,
    proxyErrorHandler: handleProxyError("product-service"),
  })
);

app.use(
  "/api/categories",
  proxy(PRODUCT, {
    timeout: PROXY_TIMEOUT,
    proxyReqPathResolver: (req) => `/api/categories${req.url}`,
    proxyReqOptDecorator: forwardHeaders,
    proxyErrorHandler: handleProxyError("category-service"),
  })
);

app.use(
  "/api/ai-menu",
  proxy(AI_MENU, {
    timeout: PROXY_TIMEOUT,
    proxyReqPathResolver: (req) => `/api/ai-menu${req.url}`,
    proxyReqOptDecorator: forwardHeaders,
    proxyErrorHandler: handleProxyError("ai-menu-service"),
  })
);

app.listen(PORT, () => {
  console.log(`Gateway running on http://localhost:${PORT}`);
  console.log(`Frontend origin: ${FRONTEND}`);
  console.log(`Uploads served from: ${UPLOAD_DIR}`);
  console.log(`AI Menu Service URL: ${AI_MENU}`);
});
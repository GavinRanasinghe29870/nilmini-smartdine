require("dotenv").config();

const express = require("express");
const cors = require("cors");
const proxy = require("express-http-proxy");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;
const AUTH = process.env.AUTH_SERVICE_URL || "http://localhost:5001";
const STAFF = process.env.STAFF_SERVICE_URL || "http://localhost:5002";
const FRONTEND = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

app.use(cors({ origin: FRONTEND, credentials: true }));

app.get("/api/health", (req, res) => res.json({ ok: true }));

// auth-service
app.use(
  "/api/auth",
  proxy(AUTH, {
    proxyReqPathResolver: (req) => `/api/auth${req.url}`,
    proxyReqOptDecorator: (proxyReqOpts, req) => {
      proxyReqOpts.headers = proxyReqOpts.headers || {};
      if (req.headers.cookie) proxyReqOpts.headers.cookie = req.headers.cookie;
      if (req.headers.authorization) proxyReqOpts.headers.authorization = req.headers.authorization;
      return proxyReqOpts;
    },

    userResHeaderDecorator: (headers) => {
      if (headers["set-cookie"]) {
        headers["set-cookie"] = headers["set-cookie"].map((c) =>
          c.replace(/;\s*Domain=[^;]+/i, "")
        );
      }
      return headers;
    },
  })
);

// staff-service
app.use(
  "/api/staff",
  proxy(STAFF, {
    proxyReqPathResolver: (req) => `/api/staff${req.url}`,
    proxyReqOptDecorator: (proxyReqOpts, req) => {
      proxyReqOpts.headers = proxyReqOpts.headers || {};
      if (req.headers.cookie) proxyReqOpts.headers.cookie = req.headers.cookie;
      if (req.headers.authorization) proxyReqOpts.headers.authorization = req.headers.authorization;
      return proxyReqOpts;
    },
  })
);

app.listen(PORT, () => console.log(`Gateway running http://localhost:${PORT}`));
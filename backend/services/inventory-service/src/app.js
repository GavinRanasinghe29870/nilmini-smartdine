const express = require("express");
const cors = require("cors");
const inventoryRoutes = require("./routes/inventory.routes");

const app = express();

const FRONTEND = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

app.use(
  cors({
    origin: FRONTEND,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "inventory-service" });
});

app.use("/api/inventory", inventoryRoutes);

app.use((err, req, res, next) => {
  console.error("app error:", err);

  return res.status(500).json({
    success: false,
    message: err?.message || "Internal server error",
  });
});

module.exports = app;
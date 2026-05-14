const express = require("express");
const cors = require("cors");
const aiMenuRoutes = require("./routes/aiMenu.routes");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));

app.get("/health", (req, res) => {
  res.json({
    service: "ai-menu-service",
    status: "running",
  });
});

app.use("/api/ai-menu", aiMenuRoutes);

module.exports = app;
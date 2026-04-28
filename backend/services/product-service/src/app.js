const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const productRoutes = require("./routes/product.routes");
const categoryRoutes = require("./routes/category.routes");

const app = express();

const uploadDir =
  process.env.FRONTEND_UPLOAD_DIR ||
  path.resolve(__dirname, "../../../../frontend/public/uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

app.use(
  "/uploads",
  express.static(uploadDir, {
    etag: false,
    maxAge: 0,
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "no-store");
    },
  })
);

app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Product service running",
  });
});

app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);

module.exports = app;
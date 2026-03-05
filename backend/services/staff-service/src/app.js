const express = require("express");
const helmet = require("helmet");
const staffRoutes = require("./routes/staff.routes");
const cors = require("cors");

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(helmet());
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true, service: "staff-service" }));

app.use("/api/staff", staffRoutes);

module.exports = app;

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const { configurePassport } = require("./config/passport");

const authRoutes = require("./routes/auth.routes");
const staffRoutes = require("./routes/staff.routes");

const app = express();

configurePassport();

app.use(
  cors({
    origin:
      process.env.CLIENT_ORIGIN ||
      process.env.CORS_ORIGIN ||
      process.env.CLIENT_URL ||
      "http://localhost:3000",
    credentials: true,
  })
);

app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "auth-service" });
});

app.use("/api/auth", authRoutes);
app.use("/api/staff", staffRoutes);

module.exports = app;
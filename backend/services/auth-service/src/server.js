require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth.routes");
const staffRoutes = require("./routes/staff.routes");

const app = express();

app.use(express.json());
app.use(cookieParser());

const origin = process.env.CORS_ORIGIN || process.env.CLIENT_URL || "http://localhost:3000";
app.use(cors({ origin, credentials: true }));

app.use("/api/auth", authRoutes);
app.use("/api/staff", staffRoutes);

app.get("/", (req, res) => res.send("Auth service running"));

const PORT = process.env.PORT || 5001;

async function start() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("Missing MONGO_URI in auth-service .env");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, 
    });

    console.log("MongoDB connected (auth-service)");

    app.listen(PORT, () => {
      console.log(`Auth service listening on ${PORT}`);
    });
  } catch (err) {
    console.error("Auth service failed to start:", err.message);
    process.exit(1);
  }
}

start();
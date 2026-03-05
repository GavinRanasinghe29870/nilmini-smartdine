require("dotenv").config();

const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/user.model");

// ✅ change these values (or keep and login with them)
const OWNER_EMAIL = process.env.OWNER_EMAIL || "owner@restaurant.com";
const OWNER_USERNAME = process.env.OWNER_USERNAME || "owner";
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || "Owner@12345";
const OWNER_FULLNAME = process.env.OWNER_FULLNAME || "System Owner";

(async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI is missing in .env");
      process.exit(1);
    }

    await connectDB();

    // hash password
    const hashed = await bcrypt.hash(OWNER_PASSWORD, 10);

    // ✅ Upsert: if exists by email OR username, update to OWNER + password
    const user = await User.findOneAndUpdate(
      {
        $or: [{ email: OWNER_EMAIL.toLowerCase().trim() }, { username: OWNER_USERNAME.trim() }],
      },
      {
        fullName: OWNER_FULLNAME,
        email: OWNER_EMAIL.toLowerCase().trim(),
        username: OWNER_USERNAME.trim(),
        password: hashed,
        role: "OWNER",
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    console.log("✅ OWNER seeded successfully:");
    console.log("   Email    :", user.email);
    console.log("   Username :", user.username);
    console.log("   Role     :", user.role);
    console.log("   Password :", OWNER_PASSWORD); // (plain only for you to login)

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
})();

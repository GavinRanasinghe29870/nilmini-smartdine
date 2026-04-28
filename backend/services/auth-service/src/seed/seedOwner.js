const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");

async function seedOwner() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("Missing MONGO_URI in auth-service/.env");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("MongoDB connected");

    const ownerEmail = "owner@nilmini.com";
    const ownerUsername = "owner";
    const plainPassword = "Owner@123";

    const existingOwner = await User.findOne({
      $or: [{ email: ownerEmail }, { username: ownerUsername }],
    });

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    if (existingOwner) {
      existingOwner.fullName = "System Owner";
      existingOwner.email = ownerEmail;
      existingOwner.username = ownerUsername;
      existingOwner.password = hashedPassword;
      existingOwner.role = "OWNER";
      existingOwner.tokenVersion = 0;

      await existingOwner.save();

      console.log("Owner already existed, updated successfully");
      console.log({
        id: existingOwner._id,
        fullName: existingOwner.fullName,
        email: existingOwner.email,
        username: existingOwner.username,
        role: existingOwner.role,
      });

      console.log("Login credentials:");
      console.log({
        emailOrUsername: ownerEmail,
        username: ownerUsername,
        password: plainPassword,
      });

      await mongoose.disconnect();
      process.exit(0);
    }

    const owner = await User.create({
      fullName: "System Owner",
      email: ownerEmail,
      username: ownerUsername,
      password: hashedPassword,
      role: "OWNER",
      phone: "",
      salary: 0,
      address: "",
      additionalDetails: "Seeded owner account",
      tokenVersion: 0,
    });

    console.log("Owner created successfully");
    console.log({
      id: owner._id,
      fullName: owner.fullName,
      email: owner.email,
      username: owner.username,
      role: owner.role,
    });

    console.log("Login credentials:");
    console.log({
      emailOrUsername: ownerEmail,
      username: ownerUsername,
      password: plainPassword,
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err.message);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  }
}

seedOwner();
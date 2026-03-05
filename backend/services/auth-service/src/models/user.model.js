const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    username: { type: String, trim: true, unique: true, sparse: true },

    password: { type: String, required: true }, // hashed

    role: {
      type: String,
      enum: ["OWNER", "MANAGER", "CASHIER", "WAITER", "STAFF"],
      default: "STAFF",
      required: true,
    },

    phone: { type: String, trim: true, default: "" },
    salary: { type: Number, default: 0 },
    dob: { type: Date },
    shiftStart: { type: String, default: "" },
    shiftEnd: { type: String, default: "" },
    address: { type: String, default: "" },
    additionalDetails: { type: String, default: "" },

    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

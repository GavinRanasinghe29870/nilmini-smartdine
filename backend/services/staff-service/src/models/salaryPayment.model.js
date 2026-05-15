const mongoose = require("mongoose");

const salaryPaymentSchema = new mongoose.Schema(
  {
    staffId: {
      type: String,
      required: true,
      index: true,
    },

    staffName: {
      type: String,
      default: "",
      trim: true,
    },

    role: {
      type: String,
      default: "STAFF",
      trim: true,
    },

    baseSalary: {
      type: Number,
      default: 0,
      min: 0,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "LKR",
    },

    paymentMonth: {
      type: String,
      required: true,
      index: true,
    },

    paidAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },

    paidBy: {
      id: { type: String, default: "" },
      fullName: { type: String, default: "" },
      role: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SalaryPayment", salaryPaymentSchema);
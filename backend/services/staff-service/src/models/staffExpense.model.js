const mongoose = require("mongoose");

const staffExpenseSchema = new mongoose.Schema(
  {
    staffId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    staffName: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["OWNER", "MANAGER", "CASHIER", "WAITER", "STAFF"],
      required: true,
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
      enum: ["LKR"],
    },

    expenseType: {
      type: String,
      enum: [
        "Salary Payment",
        "Salary Advance",
        "Medical",
        "Emergency",
        "Transport",
        "Food",
        "Other",
      ],
      default: "Salary Payment",
      required: true,
      index: true,
    },

    deductFromSalary: {
      type: Boolean,
      default: false,
    },

    paymentMonth: {
      type: String,
      required: true,
      trim: true,
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

    createdBy: {
      id: { type: String, default: "" },
      fullName: { type: String, default: "" },
      role: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StaffExpense", staffExpenseSchema);
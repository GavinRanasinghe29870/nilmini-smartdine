const mongoose = require("mongoose");

const dailyProductSalesSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      trim: true,
    },

    productId: {
      type: String,
      default: "",
      trim: true,
    },

    productName: {
      type: String,
      required: true,
      trim: true,
    },

    categoryName: {
      type: String,
      default: "",
      trim: true,
    },

    totalQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    weather: {
      type: String,
      default: "Normal",
      trim: true,
    },

    dayType: {
      type: String,
      enum: ["Holiday", "Work Day"],
      default: "Work Day",
    },
  },
  {
    timestamps: true,
  }
);

dailyProductSalesSchema.index(
  { date: 1, productName: 1 },
  { unique: true }
);

module.exports = mongoose.model("DailyProductSales", dailyProductSalesSchema);
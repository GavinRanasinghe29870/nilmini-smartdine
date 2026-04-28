const mongoose = require("mongoose");

const generatedMenuSchema = new mongoose.Schema(
  {
    menuDate: {
      type: String,
      required: true,
    },

    generatedBy: {
      type: String,
      default: "gemini",
    },

    status: {
      type: String,
      enum: ["draft", "approved", "rejected"],
      default: "draft",
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    predictions: [
      {
        productName: String,
        predictedQuantity: Number,
        predictionType: String,
        evaluationLane: String,
        reliability: String,
        testMape: String,
        testWmape: String,
      },
    ],

    menuItems: [
      {
        productName: String,
        predictedQuantity: Number,
        recommendedProductionQuantity: Number,
        confidence: String,
        reason: String,
      },
    ],

    ingredientList: [
      {
        ingredientName: String,
        requiredQuantity: String,
        relatedProducts: [String],
      },
    ],

    summary: String,
    warnings: [String],

    rawGeminiResponse: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GeneratedMenu", generatedMenuSchema);
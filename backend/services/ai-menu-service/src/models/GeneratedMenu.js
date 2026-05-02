const mongoose = require("mongoose");

const generatedMenuSchema = new mongoose.Schema(
  {
    menuDate: {
      type: String,
      required: true,
      index: true,
    },

    generatedBy: {
      type: String,
      default: "gemini",
    },

    status: {
      type: String,
      enum: ["draft", "approved", "rejected"],
      default: "draft",
      index: true,
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
        testMape: mongoose.Schema.Types.Mixed,
        testWmape: mongoose.Schema.Types.Mixed,
      },
    ],

    menuItems: [
      {
        productId: String,
        productName: String,
        productImage: String,
        categoryName: String,
        price: Number,
        availability: String,
        productType: String,

        predictedQuantity: Number,
        recommendedProductionQuantity: Number,

        confidence: String,
        reliability: String,
        predictionType: String,
        evaluationLane: String,
        testMape: mongoose.Schema.Types.Mixed,
        testWmape: mongoose.Schema.Types.Mixed,

        managerReviewRequired: {
          type: Boolean,
          default: false,
        },

        reason: String,
      },
    ],

    ingredientList: [
      {
        ingredientName: String,
        requiredQuantityNumber: Number,
        unit: String,
        requiredQuantity: String,
        relatedProducts: [String],
      },
    ],

    summary: {
      type: String,
      default: "",
    },

    warnings: {
      type: [String],
      default: [],
    },

    rawGeminiResponse: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

generatedMenuSchema.index({ menuDate: 1, status: 1 });

module.exports = mongoose.model("GeneratedMenu", generatedMenuSchema);
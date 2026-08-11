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

    customerPreference: {
      predictionDate: String,
      predictedCustomerGroup: String,
      confidencePercentage: Number,
      candidateScores: [
        {
          customerGroup: String,
          predictedScore: Number,
          normalizedScorePercentage: Number,
        },
      ],
      preferredFoodItems: [
        {
          productName: String,
          preferenceScore: mongoose.Schema.Types.Mixed,
          totalUnitsByGroup: mongoose.Schema.Types.Mixed,
          groupProductShare: mongoose.Schema.Types.Mixed,
        },
      ],
      note: {
        type: String,
        default: "",
      },
    },

    adjustedProducts: [
      {
        productName: String,
        predictedQuantity: Number,
        adjustedQuantity: Number,
        adjustmentValue: Number,
        adjustmentPercent: Number,
        preferenceScore: mongoose.Schema.Types.Mixed,
        reason: String,
      },
    ],

    menuItems: [
      {
        productId: String,
        itemId: String,
        productDbName: String,
        productName: String,
        productImage: String,
        categoryName: String,
        price: Number,
        availability: String,
        productType: String,

        predictedQuantity: Number,
        adjustedQuantity: Number,

        /*
          This is now the live Today Menu quantity.
          When cashier confirms payment:
          recommendedProductionQuantity = recommendedProductionQuantity - orderedQuantity
        */
        recommendedProductionQuantity: Number,

        confidence: String,
        reliability: String,
        predictionType: String,
        evaluationLane: String,
        testMape: mongoose.Schema.Types.Mixed,
        testWmape: mongoose.Schema.Types.Mixed,

        isPreferredForPredictedGroup: {
          type: Boolean,
          default: false,
        },

        preferenceScore: {
          type: mongoose.Schema.Types.Mixed,
          default: null,
        },

        customerPreferenceRank: {
          type: mongoose.Schema.Types.Mixed,
          default: null,
        },

        customerPreferenceNote: {
          type: String,
          default: "",
        },

        adjustmentReason: {
          type: String,
          default: "",
        },

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

    inventoryRequirementList: [
      {
        ingredientName: String,
        inventoryItemId: String,
        inventoryItemName: String,

        requiredQuantityNumber: Number,
        availableQuantityNumber: Number,
        shortageQuantityNumber: Number,

        unit: String,
        requiredQuantity: String,
        availableQuantity: String,
        shortageQuantity: String,

        status: String,
        relatedProducts: [String],
      },
    ],

    stockConsumptionHistory: [
      {
        orderId: String,
        orderNumber: String,
        consumedAt: {
          type: Date,
          default: Date.now,
        },
        items: [
          {
            productId: String,
            itemId: String,
            productName: String,
            quantity: Number,
            matchedMenuProductName: String,
          },
        ],
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
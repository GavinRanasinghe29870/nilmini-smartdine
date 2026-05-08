const GeneratedMenu = require("../models/GeneratedMenu");
const { getNextDayPredictions } = require("../services/mlPrediction.service");
const { generateMenuWithGemini } = require("../services/geminiMenu.service");
const {
  getColomboDateString,
  isAfterFivePmColombo,
  getMonthPeriod,
} = require("../services/date.service");
const {
  enrichPredictionsWithProducts,
  getMenuEligibleItems,
} = require("../services/productEnrichment.service");
const {
  calculateIngredientRequirements,
} = require("../services/ingredientCalculator.service");
const {
  getCustomerMenuPreference,
} = require("../services/customerPreference.service");
const {
  adjustMenuItemsByCustomerPreference,
} = require("../services/preferenceAdjustment.service");

function normalizeConfidence(value) {
  const text = String(value || "").trim();

  if (!text) return "Review";

  return text;
}

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function isManagerReviewRequired(item) {
  const reliability = String(item.reliability || "").toLowerCase();
  const lane = String(item.evaluationLane || "").toLowerCase();

  return (
    reliability === "poor" ||
    reliability === "review" ||
    reliability === "unknown" ||
    lane === "fallback_only"
  );
}

function buildMenuItemsFromPredictions(predictions = []) {
  return predictions.map((item) => {
    const predictedQuantity = Number(item.predictedQuantity || 0);
    const managerReviewRequired = isManagerReviewRequired(item);

    return {
      productId: item.productId || "",
      productName: item.productName,
      productImage: item.productImage || "",
      categoryName: item.categoryName || "",
      price: Number(item.price || 0),
      availability: item.availability || "In Stock",
      productType: item.productType || "prepared_food",
      ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],

      predictedQuantity,
      adjustedQuantity: predictedQuantity,
      recommendedProductionQuantity: predictedQuantity,

      confidence: normalizeConfidence(item.reliability),
      reliability: item.reliability || "Review",
      predictionType: item.predictionType || "unknown",
      evaluationLane: item.evaluationLane || "unknown",
      testMape: item.testMape ?? null,
      testWmape: item.testWmape ?? null,

      isPreferredForPredictedGroup: false,
      preferenceScore: null,
      customerPreferenceRank: null,
      customerPreferenceNote: "",
      adjustmentReason: "",

      managerReviewRequired,

      reason:
        item.reliability === "Good" || item.reliability === "Moderate"
          ? `Based on ${item.predictionType || "ML"} prediction with ${
              item.reliability
            } reliability.`
          : `Manager review recommended because reliability is ${
              item.reliability || "Review"
            } and prediction type is ${item.predictionType || "unknown"}.`,
    };
  });
}

function buildWarningsFromPredictions(predictions = []) {
  return predictions
    .filter((item) => isManagerReviewRequired(item))
    .map((item) => {
      return `Product '${item.productName}' needs manager review. Reliability: ${
        item.reliability || "Review"
      }, prediction type: ${item.predictionType || "unknown"}.`;
    });
}

function buildDefaultSummary(predictionDate, menuItems, customerPreference) {
  const availableItems = menuItems.filter(
    (item) => Number(item.adjustedQuantity || item.predictedQuantity || 0) > 0
  );

  if (!availableItems.length) {
    return `The menu for ${predictionDate} has no items available based on the current predictions. Please review the menu plan.`;
  }

  const topItems = [...availableItems]
    .sort(
      (a, b) =>
        Number(b.adjustedQuantity || b.predictedQuantity || 0) -
        Number(a.adjustedQuantity || a.predictedQuantity || 0)
    )
    .slice(0, 5)
    .map(
      (item) =>
        `${item.productName} (${item.adjustedQuantity || item.predictedQuantity})`
    )
    .join(", ");

  const groupText = customerPreference?.predictedCustomerGroup
    ? ` The predicted most visiting customer group is ${customerPreference.predictedCustomerGroup}.`
    : "";

  return `The predicted menu for ${predictionDate} includes ${availableItems.length} items. Main production items include ${topItems}.${groupText} Manager review is recommended for low reliability items.`;
}

function uniqueWarnings(items = []) {
  return [...new Set(items.filter(Boolean))];
}

function mergeGeminiMenuItems(baseItems, geminiItems = []) {
  const geminiMap = new Map();

  for (const item of geminiItems) {
    geminiMap.set(normalizeName(item.productName), item);
  }

  return baseItems.map((baseItem) => {
    const geminiItem = geminiMap.get(normalizeName(baseItem.productName));

    if (!geminiItem) {
      return baseItem;
    }

    return {
      ...baseItem,

      productName: baseItem.productName,
      predictedQuantity: baseItem.predictedQuantity,
      adjustedQuantity: baseItem.adjustedQuantity,
      recommendedProductionQuantity: baseItem.recommendedProductionQuantity,

      confidence: geminiItem.confidence || baseItem.confidence,
      managerReviewRequired:
        typeof geminiItem.managerReviewRequired === "boolean"
          ? geminiItem.managerReviewRequired
          : baseItem.managerReviewRequired,
      reason: geminiItem.reason || baseItem.reason,
    };
  });
}

function buildCustomerPreferenceSnapshot(customerPreference) {
  if (!customerPreference) {
    return {
      predictionDate: "",
      predictedCustomerGroup: "",
      confidencePercentage: 0,
      candidateScores: [],
      preferredFoodItems: [],
      note: "Customer preference prediction was not available.",
    };
  }

  return {
    predictionDate: customerPreference.predictionDate || "",
    predictedCustomerGroup: customerPreference.predictedCustomerGroup || "",
    confidencePercentage: Number(customerPreference.confidencePercentage || 0),
    candidateScores: Array.isArray(customerPreference.candidateScores)
      ? customerPreference.candidateScores
      : [],
    preferredFoodItems: Array.isArray(customerPreference.preferredFoodItems)
      ? customerPreference.preferredFoodItems
      : [],
    note: customerPreference.note || "",
  };
}

const generateMenu = async (req, res) => {
  try {
    const {
      predictionDate,
      weatherType,
      holiday,
      beforeHolidayFlag,
      afterHolidayFlag,
      monthPeriod,
      forceRegenerate,
    } = req.body;

    const finalPredictionDate = predictionDate || getColomboDateString(1);
    const finalMonthPeriod = monthPeriod || getMonthPeriod(finalPredictionDate);

    if (!forceRegenerate) {
      const existingMenu = await GeneratedMenu.findOne({
        menuDate: finalPredictionDate,
        status: { $in: ["draft", "approved"] },
      }).sort({ createdAt: -1 });

      if (existingMenu) {
        return res.status(200).json({
          success: true,
          message: "AI menu already generated for this date",
          data: existingMenu,
        });
      }
    }

    const mlResult = await getNextDayPredictions({
      predictionDate: finalPredictionDate,
      weatherType: weatherType || "Normal",
      holiday: holiday || "No",
      beforeHolidayFlag: beforeHolidayFlag || "No",
      afterHolidayFlag: afterHolidayFlag || "No",
      monthPeriod: finalMonthPeriod,
    });

    const predictions = mlResult.predictions || [];

    if (!predictions.length) {
      return res.status(404).json({
        success: false,
        message: "No ML predictions found for menu generation",
      });
    }

    const productResult = await enrichPredictionsWithProducts(predictions);
    const menuEligiblePredictions = getMenuEligibleItems(productResult.enriched);

    const baseMenuItems = buildMenuItemsFromPredictions(menuEligiblePredictions);
    const baseWarnings = buildWarningsFromPredictions(menuEligiblePredictions);

    let customerPreference = null;
    const customerPreferenceWarnings = [];

    try {
      customerPreference = await getCustomerMenuPreference({
        predictionDate: finalPredictionDate,
        weatherType: weatherType || "Normal",
        holiday: holiday || "No",
        monthPeriod: finalMonthPeriod,
        topN: 8,
      });
    } catch (preferenceError) {
      console.error("Customer preference prediction skipped:", preferenceError);

      customerPreferenceWarnings.push(
        `Customer preference adjustment skipped: ${preferenceError.message}`
      );
    }

    const { adjustedMenuItems, adjustedProducts } =
      adjustMenuItemsByCustomerPreference({
        menuItems: baseMenuItems,
        customerPreference,
      });

    const ingredientResult = calculateIngredientRequirements(adjustedMenuItems);

    const baseSummary = buildDefaultSummary(
      finalPredictionDate,
      adjustedMenuItems,
      customerPreference
    );

    let geminiMenu = null;

    try {
      geminiMenu = await generateMenuWithGemini({
        predictionDate: finalPredictionDate,
        menuItems: adjustedMenuItems,
        ingredientList: ingredientResult.ingredientList,
        customerPreference,
      });
    } catch (geminiError) {
      console.error("Gemini generation skipped/fallback used:", geminiError);
    }

    const finalMenuItems =
      Array.isArray(geminiMenu?.menuItems) && geminiMenu.menuItems.length > 0
        ? mergeGeminiMenuItems(adjustedMenuItems, geminiMenu.menuItems)
        : adjustedMenuItems;

    const warnings = uniqueWarnings([
      ...baseWarnings,
      ...(productResult.warnings || []),
      ...(ingredientResult.warnings || []),
      ...customerPreferenceWarnings,
      ...(Array.isArray(geminiMenu?.warnings) ? geminiMenu.warnings : []),
    ]);

    const savedMenu = await GeneratedMenu.create({
      menuDate: finalPredictionDate,
      predictions,
      customerPreference: buildCustomerPreferenceSnapshot(customerPreference),
      adjustedProducts,
      menuItems: finalMenuItems,
      ingredientList: ingredientResult.ingredientList,
      summary: geminiMenu?.summary || baseSummary,
      warnings,
      rawGeminiResponse: geminiMenu || {},
      status: "draft",
    });

    return res.status(201).json({
      success: true,
      message: "AI menu generated successfully",
      data: savedMenu,
    });
  } catch (error) {
    console.error("Generate menu error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate AI menu",
      error: error.message,
    });
  }
};

const getGeneratedMenus = async (req, res) => {
  try {
    const menus = await GeneratedMenu.find().sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: menus,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch generated menus",
      error: error.message,
    });
  }
};

const getTodayMenu = async (req, res) => {
  try {
    const todayDate = getColomboDateString(0);

    const menu = await GeneratedMenu.findOne({
      menuDate: todayDate,
      status: "approved",
    }).sort({ approvedAt: -1, updatedAt: -1 });

    return res.json({
      success: true,
      data: menu || null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch today's menu",
      error: error.message,
    });
  }
};

const approveGeneratedMenu = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isAfterFivePmColombo()) {
      return res.status(403).json({
        success: false,
        message: "Approve Menu can be clicked only after 5.00 p.m.",
      });
    }

    const menu = await GeneratedMenu.findById(id);

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Generated menu not found",
      });
    }

    const tomorrowDate = getColomboDateString(1);

    if (menu.menuDate !== tomorrowDate) {
      return res.status(400).json({
        success: false,
        message: `Only tomorrow's predicted menu can be approved. Tomorrow is ${tomorrowDate}.`,
      });
    }

    menu.status = "approved";
    menu.approvedAt = new Date();

    await menu.save();

    return res.json({
      success: true,
      message:
        "Menu approved successfully. It will appear in Today Menu after 12.00 a.m.",
      data: menu,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to approve menu",
      error: error.message,
    });
  }
};

module.exports = {
  generateMenu,
  getGeneratedMenus,
  getTodayMenu,
  approveGeneratedMenu,
};
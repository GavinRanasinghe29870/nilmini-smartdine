const GeneratedMenu = require("../models/GeneratedMenu");
const { getNextDayPredictions } = require("../services/mlPrediction.service");
const { generateMenuWithGemini } = require("../services/geminiMenu.service");
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
  getColomboDateString,
  isAfterFivePmColombo,
  getMonthPeriod,
} = require("../services/date.service");

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function uniqueStrings(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeConfidence(value) {
  const text = String(value || "").trim();

  if (!text) return "Review";

  return text;
}

function requiresManagerReview(item) {
  const reliability = String(item.reliability || "").toLowerCase();
  const lane = String(item.evaluationLane || "").toLowerCase();

  return (
    reliability === "poor" ||
    reliability === "review" ||
    reliability === "unknown" ||
    lane === "fallback_only"
  );
}

function buildReason(item) {
  if (!requiresManagerReview(item)) {
    return `Based on ${item.predictionType || "ML"} prediction with ${
      item.reliability || "Moderate"
    } reliability.`;
  }

  return `Manager review recommended because reliability is ${
    item.reliability || "Review"
  } and prediction type is ${item.predictionType || "unknown"}.`;
}

function buildMenuItemsFromPredictions(predictions = []) {
  return predictions.map((item) => {
    const predictedQuantity = Number(item.predictedQuantity || 0);

    return {
      productId: item.productId || "",
      itemId: item.itemId || "",
      productDbName: item.productDbName || "",
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

      managerReviewRequired: requiresManagerReview(item),
      reason: buildReason(item),
    };
  });
}

function buildWarningsFromPredictions(predictions = []) {
  return predictions
    .filter((item) => requiresManagerReview(item))
    .map((item) => {
      return `Product '${item.productName}' needs manager review. Reliability: ${
        item.reliability || "Review"
      }, prediction type: ${item.predictionType || "unknown"}.`;
    });
}

function buildDefaultSummary(predictionDate, menuItems, customerPreference) {
  const availableItems = menuItems.filter(
    (item) => Number(item.recommendedProductionQuantity || 0) > 0
  );

  if (!availableItems.length) {
    return `The menu for ${predictionDate} has no items available based on the current predictions. Please review the menu plan.`;
  }

  const topItems = [...availableItems]
    .sort(
      (a, b) =>
        Number(b.recommendedProductionQuantity || 0) -
        Number(a.recommendedProductionQuantity || 0)
    )
    .slice(0, 5)
    .map(
      (item) =>
        `${item.productName} (${Number(item.recommendedProductionQuantity || 0)})`
    )
    .join(", ");

  const groupText = customerPreference?.predictedCustomerGroup
    ? ` The predicted most visiting customer group is ${customerPreference.predictedCustomerGroup}.`
    : "";

  return `The predicted menu for ${predictionDate} includes ${availableItems.length} items. Main production items include ${topItems}.${groupText} Manager review is recommended for low reliability items.`;
}

function getPreferenceAdjustmentUnits(rank) {
  if (rank <= 2) return 15;
  if (rank <= 5) return 12;
  return 10;
}

function applyCustomerPreferenceAdjustments(menuItems, customerPreference) {
  if (
    !customerPreference ||
    !Array.isArray(customerPreference.preferredFoodItems) ||
    customerPreference.preferredFoodItems.length === 0
  ) {
    return {
      adjustedMenuItems: menuItems,
      adjustedProducts: [],
    };
  }

  const preferenceMap = new Map();

  customerPreference.preferredFoodItems.forEach((item, index) => {
    const productName = String(item.productName || "").trim();

    if (!productName) return;

    preferenceMap.set(normalizeText(productName), {
      ...item,
      rank: index + 1,
    });
  });

  const adjustedProducts = [];

  const adjustedMenuItems = menuItems.map((item) => {
    const matchedPreference = preferenceMap.get(normalizeText(item.productName));

    if (!matchedPreference) {
      return item;
    }

    const adjustmentValue = getPreferenceAdjustmentUnits(
      matchedPreference.rank || 1
    );

    const predictedQuantity = Number(item.predictedQuantity || 0);
    const adjustedQuantity = predictedQuantity + adjustmentValue;

    adjustedProducts.push({
      productName: item.productName,
      predictedQuantity,
      adjustedQuantity,
      adjustmentValue,
      adjustmentPercent:
        predictedQuantity > 0
          ? Math.round((adjustmentValue / predictedQuantity) * 100 * 100) / 100
          : 0,
      preferenceScore: matchedPreference.preferenceScore ?? null,
      reason: `${item.productName} increased by ${adjustmentValue} units because ${
        customerPreference.predictedCustomerGroup || "the predicted customer group"
      } prefers this product.`,
    });

    return {
      ...item,
      adjustedQuantity,
      recommendedProductionQuantity: adjustedQuantity,
      isPreferredForPredictedGroup: true,
      preferenceScore: matchedPreference.preferenceScore ?? null,
      customerPreferenceRank: matchedPreference.rank || null,
      customerPreferenceNote: `Preferred by predicted customer group: ${
        customerPreference.predictedCustomerGroup || "Unknown"
      }`,
      adjustmentReason: `Preference-based adjustment added ${adjustmentValue} units.`,
    };
  });

  return {
    adjustedMenuItems,
    adjustedProducts,
  };
}

function mergeGeminiResultIntoMenuItems(baseItems, geminiMenuItems = []) {
  const geminiMap = new Map();

  for (const item of geminiMenuItems || []) {
    geminiMap.set(normalizeText(item.productName), item);
  }

  return baseItems.map((item) => {
    const geminiItem = geminiMap.get(normalizeText(item.productName));

    return {
      ...item,
      confidence: geminiItem?.confidence || item.confidence,
      managerReviewRequired:
        typeof geminiItem?.managerReviewRequired === "boolean"
          ? geminiItem.managerReviewRequired
          : item.managerReviewRequired,
      reason: geminiItem?.reason || item.reason,
    };
  });
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

    const { enriched, warnings: productWarnings } =
      await enrichPredictionsWithProducts(predictions);

    const menuEligibleItems = getMenuEligibleItems(enriched);
    const baseMenuItems = buildMenuItemsFromPredictions(menuEligibleItems);
    const baseWarnings = buildWarningsFromPredictions(menuEligibleItems);

    let customerPreference = null;
    let adjustedProducts = [];
    let adjustedMenuItems = baseMenuItems;

    try {
      const preferenceResult = await getCustomerMenuPreference({
        predictionDate: finalPredictionDate,
        weatherType: weatherType || "Normal",
        holiday: holiday || "No",
        monthPeriod: finalMonthPeriod,
        topN: 8,
      });

      customerPreference = {
        predictionDate: preferenceResult.predictionDate,
        predictedCustomerGroup: preferenceResult.predictedCustomerGroup,
        confidencePercentage: preferenceResult.confidencePercentage,
        candidateScores: preferenceResult.candidateScores || [],
        preferredFoodItems: preferenceResult.preferredFoodItems || [],
        note:
          preferenceResult.note ||
          "This service predicts the most visiting customer group and returns preferred food items.",
      };

      const preferenceAdjusted = applyCustomerPreferenceAdjustments(
        baseMenuItems,
        customerPreference
      );

      adjustedMenuItems = preferenceAdjusted.adjustedMenuItems;
      adjustedProducts = preferenceAdjusted.adjustedProducts;
    } catch (customerPreferenceError) {
      console.error(
        "Customer preference generation skipped/fallback used:",
        customerPreferenceError
      );
    }

    const { ingredientList, warnings: ingredientWarnings } =
      calculateIngredientRequirements(adjustedMenuItems);

    let geminiMenu = null;

    try {
      geminiMenu = await generateMenuWithGemini({
        predictionDate: finalPredictionDate,
        menuItems: adjustedMenuItems,
        ingredientList,
      });
    } catch (geminiError) {
      console.error("Gemini generation skipped/fallback used:", geminiError);
    }

    const finalMenuItems = mergeGeminiResultIntoMenuItems(
      adjustedMenuItems,
      geminiMenu?.menuItems || []
    );

    const summary =
      geminiMenu?.summary ||
      buildDefaultSummary(finalPredictionDate, finalMenuItems, customerPreference);

    const warnings = uniqueStrings([
      ...baseWarnings,
      ...productWarnings,
      ...ingredientWarnings,
      ...(Array.isArray(geminiMenu?.warnings) ? geminiMenu.warnings : []),
    ]);

    const savedMenu = await GeneratedMenu.create({
      menuDate: finalPredictionDate,
      predictions,
      customerPreference: customerPreference || undefined,
      adjustedProducts,
      menuItems: finalMenuItems,
      ingredientList,
      summary,
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
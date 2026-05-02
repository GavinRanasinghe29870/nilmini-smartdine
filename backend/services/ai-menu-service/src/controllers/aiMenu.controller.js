const GeneratedMenu = require("../models/GeneratedMenu");
const { getNextDayPredictions } = require("../services/mlPrediction.service");
const { generateMenuWithGemini } = require("../services/geminiMenu.service");
const {
  getColomboDateString,
  isAfterFivePmColombo,
  getMonthPeriod,
} = require("../services/date.service");

function normalizeConfidence(value) {
  const text = String(value || "").trim();

  if (!text) return "Review";

  return text;
}

function buildMenuItemsFromPredictions(predictions = []) {
  return predictions.map((item) => {
    const predictedQuantity = Number(item.predictedQuantity || 0);

    return {
      productName: item.productName,
      predictedQuantity,
      recommendedProductionQuantity: predictedQuantity,
      confidence: normalizeConfidence(item.reliability),
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
    .filter((item) => {
      const reliability = String(item.reliability || "").toLowerCase();
      const lane = String(item.evaluationLane || "").toLowerCase();

      return (
        reliability === "poor" ||
        reliability === "review" ||
        reliability === "unknown" ||
        lane === "fallback_only"
      );
    })
    .map((item) => {
      return `Product '${item.productName}' needs manager review. Reliability: ${
        item.reliability || "Review"
      }, prediction type: ${item.predictionType || "unknown"}.`;
    });
}

function buildDefaultSummary(predictionDate, menuItems) {
  const availableItems = menuItems.filter(
    (item) => Number(item.predictedQuantity || 0) > 0
  );

  if (!availableItems.length) {
    return `The menu for ${predictionDate} has no items available based on the current predictions. Please review the menu plan.`;
  }

  const topItems = [...availableItems]
    .sort(
      (a, b) =>
        Number(b.predictedQuantity || 0) - Number(a.predictedQuantity || 0)
    )
    .slice(0, 5)
    .map((item) => `${item.productName} (${item.predictedQuantity})`)
    .join(", ");

  return `The predicted menu for ${predictionDate} includes ${availableItems.length} items. Main predicted items include ${topItems}. Manager review is recommended for low reliability items.`;
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

    const baseMenuItems = buildMenuItemsFromPredictions(predictions);
    const baseWarnings = buildWarningsFromPredictions(predictions);
    const baseSummary = buildDefaultSummary(finalPredictionDate, baseMenuItems);

    let geminiMenu = null;

    try {
      geminiMenu = await generateMenuWithGemini({
        predictionDate: finalPredictionDate,
        menuItems: baseMenuItems,
        ingredientList: [],
      });
    } catch (geminiError) {
      console.error("Gemini generation skipped/fallback used:", geminiError);
    }

    const finalMenuItems =
      Array.isArray(geminiMenu?.menuItems) && geminiMenu.menuItems.length > 0
        ? geminiMenu.menuItems.map((item, index) => ({
            productName: item.productName || baseMenuItems[index]?.productName,
            predictedQuantity:
              item.predictedQuantity ??
              baseMenuItems[index]?.predictedQuantity ??
              0,
            recommendedProductionQuantity:
              item.recommendedProductionQuantity ??
              baseMenuItems[index]?.recommendedProductionQuantity ??
              0,
            confidence: item.confidence || baseMenuItems[index]?.confidence,
            reason: item.reason || baseMenuItems[index]?.reason,
          }))
        : baseMenuItems;

    const savedMenu = await GeneratedMenu.create({
      menuDate: finalPredictionDate,
      predictions,
      menuItems: finalMenuItems,
      ingredientList: [],
      summary: geminiMenu?.summary || baseSummary,
      warnings:
        Array.isArray(geminiMenu?.warnings) && geminiMenu.warnings.length > 0
          ? geminiMenu.warnings
          : baseWarnings,
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
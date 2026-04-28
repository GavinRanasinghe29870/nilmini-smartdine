const GeneratedMenu = require("../models/GeneratedMenu");
const { getNextDayPredictions } = require("../services/mlPrediction.service");
const { generateMenuWithGemini } = require("../services/geminiMenu.service");

const TIME_ZONE = "Asia/Colombo";

function getColomboDateString(offsetDays = 0) {
  const now = new Date();
  const targetDate = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(targetDate);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function isAfterFivePmColombo() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const hour = Number(parts.find((p) => p.type === "hour")?.value || 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value || 0);

  return hour > 17 || (hour === 17 && minute >= 0);
}

const generateMenu = async (req, res) => {
  try {
    const { predictionDate, weatherType, holiday, forceRegenerate } = req.body;

    const finalPredictionDate = predictionDate || getColomboDateString(1);

    /*
      If a menu already exists in predicted or approved status for the given date in predicted menu page, return it instead of generating a new one.
    */
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
    });

    const predictions = mlResult.predictions || [];

    if (!predictions.length) {
      return res.status(404).json({
        success: false,
        message: "No ML predictions found for menu generation",
      });
    }

    const geminiMenu = await generateMenuWithGemini({
      predictionDate: finalPredictionDate,
      predictions,
    });

    const savedMenu = await GeneratedMenu.create({
      menuDate: finalPredictionDate,
      predictions,
      menuItems: geminiMenu.menuItems || [],
      ingredientList: geminiMenu.ingredientList || [],
      summary: geminiMenu.summary || "",
      warnings: geminiMenu.warnings || [],
      rawGeminiResponse: geminiMenu,
      status: "draft",
    });

    res.status(201).json({
      success: true,
      message: "AI menu generated successfully",
      data: savedMenu,
    });
  } catch (error) {
    console.error("Generate menu error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate AI menu",
      error: error.message,
    });
  }
};

const getGeneratedMenus = async (req, res) => {
  try {
    const menus = await GeneratedMenu.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: menus,
    });
  } catch (error) {
    res.status(500).json({
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

    res.json({
      success: true,
      data: menu || null,
    });
  } catch (error) {
    res.status(500).json({
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

    res.json({
      success: true,
      message:
        "Menu approved successfully. It will appear in Today Menu after 12.00 a.m.",
      data: menu,
    });
  } catch (error) {
    res.status(500).json({
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
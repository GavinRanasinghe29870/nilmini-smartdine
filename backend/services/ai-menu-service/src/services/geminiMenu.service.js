let aiClient = null;
let TypeRef = null;

async function getGeminiClient() {
  if (aiClient && TypeRef) {
    return {
      ai: aiClient,
      Type: TypeRef,
    };
  }

  const genai = await import("@google/genai");
  const { GoogleGenAI, Type } = genai;

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY in .env");
  }

  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  TypeRef = Type;

  return {
    ai: aiClient,
    Type: TypeRef,
  };
}

function getResponseText(response) {
  if (!response) return "";

  if (typeof response.text === "function") {
    return response.text();
  }

  return response.text || "";
}

function parseGeminiJson(text) {
  const value = String(text || "").trim();

  try {
    return JSON.parse(value);
  } catch {
    const cleaned = value
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  }
}

function buildSafeMenuItems(menuItems = []) {
  return menuItems.map((item) => ({
    productName: item.productName,
    predictedQuantity: Number(item.predictedQuantity || 0),
    adjustedQuantity: Number(
      item.adjustedQuantity ??
        item.recommendedProductionQuantity ??
        item.predictedQuantity ??
        0
    ),
    recommendedProductionQuantity: Number(
      item.recommendedProductionQuantity ??
        item.adjustedQuantity ??
        item.predictedQuantity ??
        0
    ),
    confidence: item.confidence || item.reliability || "Review",
    reliability: item.reliability || "Review",
    predictionType: item.predictionType || "unknown",
    evaluationLane: item.evaluationLane || "unknown",
    categoryName: item.categoryName || "",
    productType: item.productType || "prepared_food",
    isPreferredForPredictedGroup: Boolean(item.isPreferredForPredictedGroup),
    customerPreferenceRank: item.customerPreferenceRank ?? null,
    adjustmentReason: item.adjustmentReason || "",
  }));
}

async function generateMenuWithGemini({
  predictionDate,
  menuItems,
  ingredientList,
  customerPreference,
}) {
  const { ai, Type } = await getGeminiClient();

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const safeMenuItems = buildSafeMenuItems(menuItems);

  const preferenceText = customerPreference
    ? JSON.stringify(
        {
          predictionDate: customerPreference.predictionDate,
          predictedCustomerGroup: customerPreference.predictedCustomerGroup,
          confidencePercentage: customerPreference.confidencePercentage,
          preferredFoodItems: customerPreference.preferredFoodItems,
        },
        null,
        2
      )
    : "Customer preference prediction was not available.";

  const prompt = `
You are an AI menu planning assistant for Nilmini Hotel.

Generate a clear next-day menu summary, item reasons, and warnings using:
1. ML product quantity predictions.
2. Customer group preference adjustment results.
3. Calculated ingredient list.

Important rules:
1. Do not change product names.
2. Do not change predictedQuantity.
3. Do not change adjustedQuantity.
4. Do not change recommendedProductionQuantity.
5. Use recommendedProductionQuantity as the final production quantity.
6. Do not use ingredients to change predicted quantities.
7. Do not check inventory stock balance.
8. Do not invent new products.
9. Do not remove any provided menu item.
10. Ingredient quantities are already calculated by the backend. Do not change them.
11. If reliability is Poor, Review, fallback_only, or unknown, set managerReviewRequired to true.
12. Return only valid JSON.
13. Do not add markdown formatting.

Prediction date: ${predictionDate}

Customer preference prediction:
${preferenceText}

ML prediction menu items after customer preference adjustment:
${JSON.stringify(safeMenuItems, null, 2)}

Calculated ingredient list:
${JSON.stringify(ingredientList || [], null, 2)}
`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          menuDate: {
            type: Type.STRING,
          },
          summary: {
            type: Type.STRING,
          },
          menuItems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                productName: {
                  type: Type.STRING,
                },
                predictedQuantity: {
                  type: Type.NUMBER,
                },
                adjustedQuantity: {
                  type: Type.NUMBER,
                },
                recommendedProductionQuantity: {
                  type: Type.NUMBER,
                },
                confidence: {
                  type: Type.STRING,
                },
                managerReviewRequired: {
                  type: Type.BOOLEAN,
                },
                reason: {
                  type: Type.STRING,
                },
              },
              required: [
                "productName",
                "predictedQuantity",
                "adjustedQuantity",
                "recommendedProductionQuantity",
                "confidence",
                "managerReviewRequired",
                "reason",
              ],
            },
          },
          warnings: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
          },
        },
        required: ["menuDate", "summary", "menuItems", "warnings"],
      },
    },
  });

  const text = getResponseText(response);
  const parsed = parseGeminiJson(text);

  return {
    menuDate: parsed.menuDate || predictionDate,
    summary: parsed.summary || "",
    menuItems: Array.isArray(parsed.menuItems) ? parsed.menuItems : [],
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
  };
}

module.exports = {
  generateMenuWithGemini,
};
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
    recommendedProductionQuantity: Number(
      item.recommendedProductionQuantity ?? item.predictedQuantity ?? 0
    ),
    confidence: item.confidence || item.reliability || "Review",
    reliability: item.reliability || "Review",
    predictionType: item.predictionType || "unknown",
    evaluationLane: item.evaluationLane || "unknown",
    categoryName: item.categoryName || "",
    productType: item.productType || "prepared_food",
  }));
}

async function generateMenuWithGemini({
  predictionDate,
  menuItems,
  ingredientList,
}) {
  const { ai, Type } = await getGeminiClient();

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const safeMenuItems = buildSafeMenuItems(menuItems);

  const prompt = `
You are an AI menu planning assistant for Nilmini Hotel.

Generate a clear next-day menu summary, item reasons, and warnings using the ML predictions and calculated ingredient list.

Important rules:
1. Do not change product names.
2. Do not change predictedQuantity.
3. Do not change recommendedProductionQuantity.
4. Do not use ingredients to change predicted quantities.
5. Do not check inventory stock balance.
6. Do not invent new products.
7. Do not remove any provided menu item.
8. Ingredient quantities are already calculated by the backend. Do not change them.
9. If reliability is Poor, Review, fallback_only, or unknown, set managerReviewRequired to true.
10. Return only valid JSON.
11. Do not add markdown formatting.

Prediction date: ${predictionDate}

ML prediction menu items:
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
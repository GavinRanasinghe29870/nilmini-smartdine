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
  try {
    return JSON.parse(text);
  } catch {
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  }
}

const generateMenuWithGemini = async ({ predictionDate, predictions }) => {
  const { ai, Type } = await getGeminiClient();

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const prompt = `
You are an AI menu planning assistant for Nilmini Hotel.

Generate tomorrow's menu using the ML predictions below.

Important rules:
1. Do not remove any product from the ML prediction list.
2. Keep the original predicted quantity.
3. Recommended production quantity can be rounded only slightly for kitchen practicality.
4. If reliability is Poor, Review, fallback_only, or unknown, add a warning.
5. Generate a practical ingredient/stock list.
6. Return only valid JSON.
7. Do not add markdown formatting.

Prediction date: ${predictionDate}

ML predictions:
${JSON.stringify(predictions, null, 2)}
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
                reason: {
                  type: Type.STRING,
                },
              },
              required: [
                "productName",
                "predictedQuantity",
                "recommendedProductionQuantity",
                "confidence",
                "reason",
              ],
            },
          },
          ingredientList: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                ingredientName: {
                  type: Type.STRING,
                },
                requiredQuantity: {
                  type: Type.STRING,
                },
                relatedProducts: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.STRING,
                  },
                },
              },
              required: ["ingredientName", "requiredQuantity", "relatedProducts"],
            },
          },
          warnings: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
          },
        },
        required: ["menuDate", "summary", "menuItems", "ingredientList", "warnings"],
      },
    },
  });

  const text = getResponseText(response);
  return parseGeminiJson(text);
};

module.exports = {
  generateMenuWithGemini,
};
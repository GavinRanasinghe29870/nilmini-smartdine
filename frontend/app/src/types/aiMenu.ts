export type GenerateAiMenuPayload = {
  predictionDate?: string;
  weatherType?: string;
  holiday?: string;
  beforeHolidayFlag?: string;
  afterHolidayFlag?: string;
  monthPeriod?: string;
  forceRegenerate?: boolean;
};

export type CustomerPreferenceScore = {
  customerGroup: string;
  predictedScore: number;
  normalizedScorePercentage: number;
};

export type PreferredFoodItem = {
  productName: string;
  preferenceScore: number;
  totalUnitsByGroup?: number | string | null;
  groupProductShare?: number | string | null;
};

export type CustomerPreference = {
  predictionDate?: string;
  predictedCustomerGroup?: string;
  confidencePercentage?: number | null;
  candidateScores?: CustomerPreferenceScore[];
  preferredFoodItems?: PreferredFoodItem[];
  note?: string;
};

export type AdjustedProduct = {
  productName: string;
  predictedQuantity: number;
  adjustedQuantity: number;
  adjustmentValue: number;
  adjustmentPercent: number;
  preferenceScore?: number | string | null;
  reason?: string;
};

export type GeneratedAiMenuItem = {
  _id?: string;
  productId?: string;
  productName: string;
  productImage?: string;
  categoryName?: string;
  price?: number;
  availability?: string;
  productType?: string;

  predictedQuantity?: number;
  adjustedQuantity?: number;

  confidence?: string;
  reliability?: string;
  predictionType?: string;
  evaluationLane?: string;
  testMape?: number | string | null;
  testWmape?: number | string | null;

  isPreferredForPredictedGroup?: boolean;
  preferenceScore?: number | string | null;
  customerPreferenceRank?: number | string | null;
  customerPreferenceNote?: string;
  adjustmentReason?: string;

  managerReviewRequired?: boolean;
  reason?: string;
};

export type IngredientRequirement = {
  ingredientName: string;
  requiredQuantityNumber: number;
  unit: string;
  requiredQuantity: string;
  relatedProducts: string[];
};

export type GeneratedAiMenu = {
  _id: string;
  menuDate: string;
  generatedBy?: string;
  status: "draft" | "approved" | "rejected";
  approvedAt?: string | null;

  predictions?: unknown[];
  customerPreference?: CustomerPreference;
  adjustedProducts?: AdjustedProduct[];

  menuItems: GeneratedAiMenuItem[];

  ingredientList?: IngredientRequirement[];
  summary?: string;
  warnings?: string[];
  rawGeminiResponse?: unknown;

  createdAt?: string;
  updatedAt?: string;
};
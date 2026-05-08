export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  error?: string;
  data: T;
};

export type IngredientListItem = {
  _id?: string;
  ingredientName: string;
  requiredQuantityNumber: number;
  unit: string;
  requiredQuantity: string;
  relatedProducts: string[];
};

export type AdjustedProduct = {
  _id?: string;
  productName: string;
  predictedQuantity: number;
  adjustedQuantity: number;
  adjustmentValue: number;
  adjustmentPercent: number;
  preferenceScore?: number | string | null;
  reason?: string;
};

export type CustomerPreferenceCandidateScore = {
  _id?: string;
  customerGroup: string;
  predictedScore: number;
  normalizedScorePercentage: number;
};

export type PreferredFoodItem = {
  _id?: string;
  productName: string;
  preferenceScore?: number | string | null;
  totalUnitsByGroup?: number | string | null;
  groupProductShare?: number | string | null;
};

export type CustomerPreferenceInfo = {
  predictionDate?: string;
  predictedCustomerGroup?: string;
  confidencePercentage?: number;
  candidateScores?: CustomerPreferenceCandidateScore[];
  preferredFoodItems?: PreferredFoodItem[];
  note?: string;
};

export type GeneratedAiMenuItem = {
  _id?: string;

  productId?: string;
  itemId?: string;
  productDbName?: string;

  productName: string;
  productImage?: string;
  categoryName?: string;
  price?: number;
  availability?: string;
  productType?: string;

  predictedQuantity: number;
  adjustedQuantity?: number;
  recommendedProductionQuantity?: number;

  confidence?: string;
  reliability?: string;
  predictionType?: string;
  evaluationLane?: string;
  testMape?: number | null;
  testWmape?: number | null;

  isPreferredForPredictedGroup?: boolean;
  preferenceScore?: number | string | null;
  customerPreferenceRank?: number | string | null;
  customerPreferenceNote?: string;
  adjustmentReason?: string;

  managerReviewRequired?: boolean;
  reason?: string;
};

export type GeneratedAiPrediction = {
  _id?: string;
  productName: string;
  predictedQuantity: number;
  predictionType?: string;
  evaluationLane?: string;
  reliability?: string;
  testMape?: number | null;
  testWmape?: number | null;
};

export type GeneratedAiMenu = {
  _id?: string;
  menuDate: string;
  generatedBy?: string;
  status: "draft" | "approved" | "rejected";
  approvedAt?: string | null;

  predictions?: GeneratedAiPrediction[];

  customerPreference?: CustomerPreferenceInfo;
  adjustedProducts?: AdjustedProduct[];

  menuItems: GeneratedAiMenuItem[];
  ingredientList?: IngredientListItem[];

  summary?: string;
  warnings?: string[];
  rawGeminiResponse?: unknown;

  createdAt?: string;
  updatedAt?: string;
};

export type GenerateAiMenuPayload = {
  predictionDate?: string;
  weatherType?: string;
  holiday?: string;
  beforeHolidayFlag?: string;
  afterHolidayFlag?: string;
  monthPeriod?: string;
  forceRegenerate?: boolean;
};
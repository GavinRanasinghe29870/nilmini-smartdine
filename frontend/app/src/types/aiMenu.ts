export type AiMenuStatus = "draft" | "approved" | "rejected";

export type MonthPeriod = "start" | "middle" | "end";

export type AiMenuPrediction = {
  productName: string;
  predictedQuantity: number;
  predictionType?: string;
  evaluationLane?: string;
  reliability?: string;
  testMape?: string | number | null;
  testWmape?: string | number | null;
};

export type AiMenuItem = {
  _id?: string;
  productName: string;
  predictedQuantity: number;
  recommendedProductionQuantity?: number;
  confidence?: string;
  reason?: string;
};

export type AiIngredientItem = {
  ingredientName: string;
  requiredQuantity: string;
  relatedProducts: string[];
};

export type GeneratedAiMenu = {
  _id: string;
  menuDate: string;
  generatedBy?: string;
  status: AiMenuStatus;
  approvedAt?: string | null;
  predictions?: AiMenuPrediction[];
  menuItems: AiMenuItem[];
  ingredientList?: AiIngredientItem[];
  summary?: string;
  warnings?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type GenerateAiMenuPayload = {
  predictionDate?: string;
  weatherType?: string;
  holiday?: string;
  beforeHolidayFlag?: string;
  afterHolidayFlag?: string;
  monthPeriod?: MonthPeriod;
  forceRegenerate?: boolean;
};

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  error?: string;
  data: T;
};
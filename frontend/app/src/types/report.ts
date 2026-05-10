export type RevenueReportRow = {
  id: string;
  productId?: string;
  itemId?: string;
  productName: string;
  categoryName?: string;
  date: string;

  totalQuantity: number;
  averageUnitPrice: number;

  revenue: number;
  ingredientCost: number;
  profit: number;
  ingredientCostPerUnit: number;

  // compatibility fields
  sellIncome?: number;
  productExpenses?: number;
  totalRevenue?: number;
  expensePerUnit?: number;

  expenseStatus?: "calculated" | "no_ingredients" | "missing_inventory" | string;
  missingIngredients?: string[];
};

export type RevenueReportSummary = {
  totalQuantity: number;

  totalRevenue: number;
  totalIngredientCost: number;
  totalProfit: number;

  // compatibility fields
  totalIncome?: number;
  totalExpenses?: number;
};

export type RevenueReportLineChartItem = {
  date: string;
  revenue: number;
  ingredientCost: number;
  expenses?: number;
  profit: number;
};

export type RevenueReportPieChartItem = {
  name: string;
  value: number;
};

export type RevenueReportFilters = {
  startDate: string;
  endDate: string;
  search: string;
  sortBy: string;
  sortOrder: string;
};

export type RevenueReportResponse = {
  success: boolean;
  message?: string;
  filters: RevenueReportFilters;
  summary: RevenueReportSummary;
  charts: {
    pieData: RevenueReportPieChartItem[];
    lineData: RevenueReportLineChartItem[];
  };
  warnings?: string[];
  data: RevenueReportRow[];
};
export type SalesReportProductItem = {
  productId: string;
  productName: string;
  categoryName: string;
  image?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type SalesReportRow = {
  id: string;
  orderId?: string;
  orderNumber?: string;
  date: string;
  time: string;

  productSummary: string;
  itemCount: number;
  totalUnits: number;

  ageGroup: string;
  groupSize: number;
  ageGroupWithSize: string;

  weather: string;
  holiday: string;
  totalRevenue: number;

  orderStatus?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  note?: string;
  placedAt?: string;

  items: SalesReportProductItem[];
};

export type SalesReportSummary = {
  totalOrders: number;
  totalUnitSold: number;
  totalSalesRevenue: number;
  bestSellingProduct: string;
  bestSellingUnits: number;
};

export type SalesReportLineChartItem = {
  date: string;
  sales: number;
  revenue: number;
};

export type SalesReportTopProductItem = {
  productName: string;
  unitSold: number;
  revenue: number;
};

export type SalesReportFilterOptions = {
  ageGroups: string[];
  weatherTypes: string[];
  holidayTypes: string[];
};

export type SalesReportFilters = {
  startDate: string;
  endDate: string;
  search: string;
  sortBy: string;
  sortOrder: string;
  ageGroup: string;
  weather: string;
  holiday: string;
};

export type SalesReportResponse = {
  success: boolean;
  message?: string;
  filters: SalesReportFilters;
  summary: SalesReportSummary;
  charts: {
    lineData: SalesReportLineChartItem[];
    topProducts: SalesReportTopProductItem[];
  };
  filterOptions: SalesReportFilterOptions;
  warnings?: string[];
  data: SalesReportRow[];
};
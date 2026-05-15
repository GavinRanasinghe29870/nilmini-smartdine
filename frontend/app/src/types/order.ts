export type DayType = "Holiday" | "Work Day";

export type OrderStatus =
  | "Pending"
  | "Preparing"
  | "Ready"
  | "Completed"
  | "Cancelled";

export type PaymentStatus = "Pending" | "Paid" | "Cancelled";

export type PaymentMethod = "Cashier" | "Online" | "Not Selected";

export type OrderItemDto = {
  productId: string;
  productName: string;
  categoryName?: string;
  image?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type OrderDto = {
  id: string;
  orderNumber: string;
  ageGroup: string;
  groupSize: number;
  weather: string;
  dayType: DayType;
  items: OrderItemDto[];
  totalCost: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | string;
  discountAmount?: number;
  paidAmount?: number;
  balanceAmount?: number;
  paidAt?: string | null;
  note?: string;
  placedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateOrderPayload = {
  ageGroup: string;
  groupSize: number;
  weather: string;
  dayType: DayType;
  paymentMethod?: PaymentMethod | string;
  note?: string;
  items: {
    productId: string;
    productName: string;
    categoryName?: string;
    image?: string;
    quantity: number;
    unitPrice: number;
  }[];
};

export type UpdateOrderStatusPayload = {
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
};

export type ConfirmOrderPaymentPayload = {
  paidAmount: number;
  discountAmount: number;
  paymentMethod?: PaymentMethod | string;
  note?: string;
};

export type GetOrdersQuery = {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  dayType?: DayType;
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
};
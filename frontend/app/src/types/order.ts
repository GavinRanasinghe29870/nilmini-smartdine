export type DayType = "Holiday" | "Work Day";

export type OrderStatus =
  | "Pending"
  | "Preparing"
  | "Ready"
  | "Completed"
  | "Cancelled";

export type PaymentStatus = "Pending" | "Paid" | "Cancelled";

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
  paymentMethod: string;
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
  paymentMethod?: string;
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
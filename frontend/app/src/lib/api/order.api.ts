import axios, { AxiosError } from "axios";
import { api } from "../axios";
import type {
  ConfirmOrderPaymentPayload,
  CreateOrderPayload,
  GetOrdersQuery,
  OrderDto,
  UpdateOrderStatusPayload,
} from "../../types/order";

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  error?: string;
  data: T;
  count?: number;
};

type ApiErrorBody = {
  success?: boolean;
  message?: string;
  error?: string;
};

function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorBody>;

    return (
      axiosError.response?.data?.message ||
      axiosError.response?.data?.error ||
      axiosError.message ||
      "Request failed"
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}

function cleanParams(query?: GetOrdersQuery) {
  if (!query) return undefined;

  const params: Record<string, string | number> = {};

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params[key] = value as string | number;
    }
  });

  return params;
}

export async function createOrder(payload: CreateOrderPayload) {
  try {
    const response = await api.post<ApiResponse<OrderDto>>("/orders", payload);
    return response.data.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function getOrders(query?: GetOrdersQuery) {
  try {
    const response = await api.get<ApiResponse<OrderDto[]>>("/orders", {
      params: cleanParams(query),
    });

    return response.data.data || [];
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function getPendingPaymentOrders() {
  return getOrders({
    paymentStatus: "Pending",
    limit: 25,
  });
}

export async function getOrderById(id: string) {
  try {
    const response = await api.get<ApiResponse<OrderDto>>(`/orders/${id}`);
    return response.data.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function updateOrderStatus(
  id: string,
  payload: UpdateOrderStatusPayload
) {
  try {
    const response = await api.patch<ApiResponse<OrderDto>>(
      `/orders/${id}/status`,
      payload
    );

    return response.data.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function confirmOrderPayment(
  id: string,
  payload: ConfirmOrderPaymentPayload
) {
  try {
    const response = await api.patch<ApiResponse<OrderDto>>(
      `/orders/${id}/payment`,
      payload
    );

    return response.data.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function deleteOrder(id: string) {
  try {
    const response = await api.delete<ApiResponse<OrderDto>>(`/orders/${id}`);
    return response.data.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}
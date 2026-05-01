import axios, { AxiosError } from "axios";
import {
  CreateOrderPayload,
  OrderDto,
  UpdateOrderStatusPayload,
} from "../../types/order";

const API_BASE_URL = "http://localhost:5000/api";

const orderApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

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

export async function createOrder(payload: CreateOrderPayload) {
  try {
    const response = await orderApi.post<ApiResponse<OrderDto>>(
      "/orders",
      payload
    );

    return response.data.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function getOrders() {
  try {
    const response = await orderApi.get<ApiResponse<OrderDto[]>>("/orders");
    return response.data.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function getOrderById(id: string) {
  try {
    const response = await orderApi.get<ApiResponse<OrderDto>>(
      `/orders/${id}`
    );

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
    const response = await orderApi.patch<ApiResponse<OrderDto>>(
      `/orders/${id}/status`,
      payload
    );

    return response.data.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

export async function deleteOrder(id: string) {
  try {
    const response = await orderApi.delete<ApiResponse<OrderDto>>(
      `/orders/${id}`
    );

    return response.data.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}
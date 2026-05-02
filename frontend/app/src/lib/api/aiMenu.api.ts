import axios, { AxiosError } from "axios";
import { api } from "../axios";
import {
  GeneratedAiMenu,
  GenerateAiMenuPayload,
} from "../../types/aiMenu";

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  error?: string;
  data: T;
};

function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{
      success?: boolean;
      message?: string;
      error?: string;
    }>;

    if (axiosError.code === "ECONNABORTED") {
      return "AI menu generation is taking too long. Please try again.";
    }

    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error;
    }

    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }

    if (axiosError.message) {
      return axiosError.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}

export async function generateAiMenu(payload: GenerateAiMenuPayload) {
  try {
    const response = await api.post<ApiResponse<GeneratedAiMenu>>(
      "/ai-menu/generate",
      payload,
      {
        timeout: 180000,
      }
    );

    return response.data;
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error),
      data: null as unknown as GeneratedAiMenu,
    };
  }
}

export async function getGeneratedAiMenus() {
  try {
    const response = await api.get<ApiResponse<GeneratedAiMenu[]>>("/ai-menu", {
      timeout: 60000,
    });

    return response.data;
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error),
      data: [],
    };
  }
}

export async function getTodayAiMenu() {
  try {
    const response = await api.get<ApiResponse<GeneratedAiMenu | null>>(
      "/ai-menu/today",
      {
        timeout: 60000,
      }
    );

    return response.data;
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error),
      data: null,
    };
  }
}

export async function approveGeneratedAiMenu(id: string) {
  try {
    const response = await api.patch<ApiResponse<GeneratedAiMenu>>(
      `/ai-menu/${id}/approve`,
      {},
      {
        timeout: 60000,
      }
    );

    return response.data;
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error),
      data: null as unknown as GeneratedAiMenu,
    };
  }
}
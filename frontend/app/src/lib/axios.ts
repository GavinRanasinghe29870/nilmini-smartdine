import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

export const API_BASE_URL = "http://localhost:5000/api";

type ApiErrorBody = { message?: string };

type RetriableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
});

export async function refresh(): Promise<{ message?: string }> {
  const res = await refreshClient.post<{ message?: string }>("/auth/refresh");
  return res.data;
}

let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

async function ensureRefreshed(): Promise<void> {
  if (isRefreshing && refreshPromise) {
    await refreshPromise;
    return;
  }

  isRefreshing = true;

  refreshPromise = (async () => {
    await refresh();
  })();

  try {
    await refreshPromise;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
}

function getErrorMessage(err: AxiosError<ApiErrorBody>): string {
  return err.response?.data?.message || err.message || "Request failed";
}

function isAuthRoute(url?: string): boolean {
  if (!url) return false;

  return (
    url.includes("/auth/login") ||
    url.includes("/auth/forgot-password") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/logout")
  );
}

api.interceptors.request.use((config) => {
  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;

  config.headers = config.headers || {};

  if (!isFormData && !config.headers["Content-Type"]) {
    config.headers["Content-Type"] = "application/json";
  }

  return config;
});

api.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status;
    const original = error.config as RetriableConfig | undefined;

    if (!original) {
      return Promise.reject({ ...error, message: getErrorMessage(error) });
    }

    if (status === 401 && !original._retry && !isAuthRoute(original.url)) {
      original._retry = true;

      try {
        await ensureRefreshed();
        return api(original);
      } catch {
        return Promise.reject({ ...error, message: "Unauthorized" });
      }
    }

    return Promise.reject({ ...error, message: getErrorMessage(error) });
  }
);
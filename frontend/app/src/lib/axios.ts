import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

const BASE_URL = "http://localhost:5000/api";

type ApiErrorBody = { message?: string };

type RetriableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export async function refresh(): Promise<{ message?: string }> {
  const res = await api.post<{ message?: string }>("/auth/refresh");
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

api.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status;
    const original = error.config as RetriableConfig | undefined;

    if (!original) {
      return Promise.reject({ ...error, message: getErrorMessage(error) });
    }

    if (status === 401 && !original._retry) {
      original._retry = true;
      try {
        await ensureRefreshed();
        return api(original);
      } catch {
        // refresh failed -> user should login again
        return Promise.reject({ ...error, message: "Unauthorized" });
      }
    }

    return Promise.reject({ ...error, message: getErrorMessage(error) });
  }
);
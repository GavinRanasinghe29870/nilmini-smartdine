import { api, API_BASE_URL } from "../axios";
import type {
  CategoryDto,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from "../../types/category";
import type {
  ProductDto,
  CreateProductPayload,
  UpdateProductPayload,
  InventoryIngredient,
} from "../../types/product";

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

type UploadResponseData = {
  path: string;
};

function getApiOrigin() {
  return API_BASE_URL.replace(/\/api\/?$/, "");
}

export function getImageSrc(image?: string, fallback = "") {
  const value = String(image || "").trim();

  if (!value) return fallback;

  if (
    value.startsWith("blob:") ||
    value.startsWith("data:") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  const apiOrigin = getApiOrigin();

  if (value.startsWith("/uploads/")) {
    return `${apiOrigin}${value}`;
  }

  if (value.startsWith("uploads/")) {
    return `${apiOrigin}/${value}`;
  }

  return value;
}

export function normalizeImageForDb(image?: string) {
  const value = String(image || "").trim();

  if (!value) return "";

  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const url = new URL(value);
      return url.pathname;
    } catch {
      return value;
    }
  }

  if (value.startsWith("uploads/")) {
    return `/${value}`;
  }

  return value;
}

export function getInventoryIngredientUnit(item: InventoryIngredient) {
  const unit = String(
    item.unit || item.measureType || item.measuringType || item.measurementType || ""
  )
    .trim()
    .toLowerCase();

  if (["kg", "kilogram", "kilograms", "g", "gram", "grams"].includes(unit)) {
    return "g";
  }

  if (
    [
      "l",
      "liter",
      "litre",
      "liters",
      "litres",
      "ml",
      "milliliter",
      "millilitre",
      "milliliters",
      "millilitres",
    ].includes(unit)
  ) {
    return "ml";
  }

  if (["piece", "pieces", "pcs", "pc", "unit", "units"].includes(unit)) {
    return "Piece";
  }

  return "";
}

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post<ApiResponse<UploadResponseData>>(
    "/products/upload",
    formData
  );

  return res.data.data.path;
}

export async function getCategories(): Promise<CategoryDto[]> {
  const res = await api.get<ApiResponse<CategoryDto[]>>("/categories");
  return res.data.data || [];
}

export async function createCategory(
  payload: CreateCategoryPayload
): Promise<CategoryDto> {
  const res = await api.post<ApiResponse<CategoryDto>>("/categories", payload);
  return res.data.data;
}

export async function updateCategory(
  id: string,
  payload: UpdateCategoryPayload
): Promise<CategoryDto> {
  const res = await api.put<ApiResponse<CategoryDto>>(
    `/categories/${id}`,
    payload
  );

  return res.data.data;
}

export async function getProducts(): Promise<ProductDto[]> {
  const res = await api.get<ApiResponse<ProductDto[]>>("/products");
  return res.data.data || [];
}

export async function createProduct(
  payload: CreateProductPayload
): Promise<ProductDto> {
  const res = await api.post<ApiResponse<ProductDto>>("/products", payload);
  return res.data.data;
}

export async function updateProduct(
  id: string,
  payload: UpdateProductPayload
): Promise<ProductDto> {
  const res = await api.put<ApiResponse<ProductDto>>(
    `/products/${id}`,
    payload
  );

  return res.data.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`);
}

export async function getInventoryIngredients(): Promise<InventoryIngredient[]> {
  const res = await api.get<ApiResponse<InventoryIngredient[]>>("/inventory");
  return res.data.data || [];
}
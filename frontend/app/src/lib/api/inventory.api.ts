import { api, API_BASE_URL } from "../axios";
import {
  ApiResponse,
  InventoryApiItem,
  InventoryItem,
  mapInventoryItem,
} from "../../types/inventory";

export function getInventoryImageSrc(image?: string, fallback = "") {
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

  const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, "");

  if (value.startsWith("/uploads/")) {
    return `${apiOrigin}${value}`;
  }

  if (value.startsWith("uploads/")) {
    return `${apiOrigin}/${value}`;
  }

  return value;
}

export async function getAllInventory(): Promise<InventoryItem[]> {
  const res = await api.get<ApiResponse<InventoryApiItem[]>>("/inventory");
  return (res.data.data || []).map(mapInventoryItem);
}

export async function createInventoryItem(
  formData: FormData
): Promise<InventoryItem> {
  const res = await api.post<ApiResponse<InventoryApiItem>>(
    "/inventory",
    formData
  );

  return mapInventoryItem(res.data.data);
}

export async function updateInventoryItem(
  id: string,
  formData: FormData
): Promise<InventoryItem> {
  const res = await api.put<ApiResponse<InventoryApiItem>>(
    `/inventory/${id}`,
    formData
  );

  return mapInventoryItem(res.data.data);
}

export async function addInventoryQuantity(
  id: string,
  quantityToAdd: number
): Promise<InventoryItem> {
  const res = await api.patch<ApiResponse<InventoryApiItem>>(
    `/inventory/${id}/quantity`,
    { quantityToAdd }
  );

  return mapInventoryItem(res.data.data);
}

export async function deleteInventoryItem(id: string): Promise<void> {
  await api.delete(`/inventory/${id}`);
}
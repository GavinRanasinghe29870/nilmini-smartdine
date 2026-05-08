import { api } from "../axios";
import type {
  ApiResponse,
  GeneratedAiMenu,
  GenerateAiMenuPayload,
} from "../../types/aiMenu";

export async function generateAiMenu(
  payload: GenerateAiMenuPayload
): Promise<ApiResponse<GeneratedAiMenu>> {
  const res = await api.post<ApiResponse<GeneratedAiMenu>>(
    "/ai-menu/generate",
    payload
  );

  return res.data;
}

export async function getGeneratedAiMenus(): Promise<
  ApiResponse<GeneratedAiMenu[]>
> {
  const res = await api.get<ApiResponse<GeneratedAiMenu[]>>("/ai-menu");

  return res.data;
}

export async function getTodayAiMenu(): Promise<
  ApiResponse<GeneratedAiMenu | null>
> {
  const res = await api.get<ApiResponse<GeneratedAiMenu | null>>(
    "/ai-menu/today"
  );

  return res.data;
}

export async function approveGeneratedAiMenu(
  id: string
): Promise<ApiResponse<GeneratedAiMenu>> {
  const res = await api.patch<ApiResponse<GeneratedAiMenu>>(
    `/ai-menu/${id}/approve`
  );

  return res.data;
}
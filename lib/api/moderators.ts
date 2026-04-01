import api from "@/lib/axios";
import type { Moderator, PaginatedResponse } from "@/types/moderator";

const MODERATORS_BASE = "/api/admin/moderators";

export async function getModerators(params?: {
  search?: string;
  is_active?: "true" | "false";
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<Moderator>> {
  const { data } = await api.get<PaginatedResponse<Moderator>>(`${MODERATORS_BASE}/`, {
    params,
  });
  return data;
}

export async function assignModerator(payload: {
  user_id?: string;
  username?: string;
  email?: string;
  phone_number?: string;
}): Promise<Moderator> {
  const { data } = await api.post<Moderator>(`${MODERATORS_BASE}/`, payload);
  return data;
}

export async function updateModerator(
  id: string,
  payload: { is_active?: boolean }
): Promise<Moderator> {
  const { data } = await api.patch<Moderator>(`${MODERATORS_BASE}/${id}/`, payload);
  return data;
}

export async function removeModerator(id: string): Promise<void> {
  await api.delete(`${MODERATORS_BASE}/${id}/`);
}

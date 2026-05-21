import api from "@/lib/axios";
import { format, subDays, parse } from "date-fns";
import type {
  Article,
  ArticleListItem,
  AuthorLeaderboardItem,
  LeaderboardResponse,
  PaginatedResponse,
} from "@/types/article";

const ADMIN_ARTICLES_BASE = "/api/articles/admin/articles";

function getPeriodDateRange(period: "7d" | "30d" | "90d" | "all") {
  if (period === "all") {
    return {};
  }

  const daysMap: Record<"7d" | "30d" | "90d", number> = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
  };

  const fromDate = subDays(new Date(), daysMap[period]);
  const toDate = new Date();

  return {
    from_date: format(fromDate, "yyyy-MM-dd"),
    to_date: format(toDate, "yyyy-MM-dd"),
  };
}

export type GetArticlesParams = {
  status?: string
  search?: string
  campus_id?: string
  author_id?: string
  ai_generated?: string
  ordering?: string
  days?: number
  page?: number
  page_size?: number
}

export async function getArticles(
  params?: GetArticlesParams
): Promise<PaginatedResponse<ArticleListItem>> {
  const { data } = await api.get<PaginatedResponse<ArticleListItem>>(
    `${ADMIN_ARTICLES_BASE}/`,
    { params }
  );
  return data;
}

export async function getArticle(id: string): Promise<Article> {
  const { data } = await api.get<Article>(`${ADMIN_ARTICLES_BASE}/${id}/`);
  return data;
}

export async function updateArticle(
  id: string,
  payload: Partial<Article>
): Promise<Article> {
  const { data } = await api.patch<Article>(
    `${ADMIN_ARTICLES_BASE}/${id}/`,
    payload
  );
  return data;
}

export async function deleteArticle(id: string): Promise<void> {
  await api.delete(`${ADMIN_ARTICLES_BASE}/${id}/`);
}

export async function getAuthorLeaderboard(
  fromDate?: string | null,
  toDate?: string | null
): Promise<LeaderboardResponse> {
  try {
    const params: Record<string, string> = {};
    
    // If both dates provided, include them as query params
    if (fromDate && toDate) {
      params.from_date = fromDate;
      params.to_date = toDate;
    }
    // If only one date provided, this will cause backend error - which is expected
    else if (fromDate || toDate) {
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
    }
    
    console.log("🔍 Authors leaderboard request - params:", params);
    
    const { data } = await api.get<LeaderboardResponse>(
      `/api/articles/admin/articles/authors/`,
      { params }
    );
    
    console.log("📊 Authors leaderboard response:", data);
    return data || { period: "all_time", authors: [] };
  } catch (error) {
    console.error("❌ Error fetching leaderboard:", error);
    return { period: "all_time", authors: [] };
  }
}

/** POST /api/articles/upload_image/ — multipart form "image" or "file". Returns { url }. */
export async function uploadArticleImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("image", file);
  const { data } = await api.post<{ url: string }>(
    "/api/articles/upload_image/",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return data;
}

export type SubcategoryOption = {
  slug: string;
  label: string;
  requires_other: boolean;
};

export type AdminCampusOption = {
  id: string;
  name: string;
  slug: string;
};

/** GET /api/articles/subcategories/?category=<slug> */
export async function getSubcategories(
  categorySlug: string
): Promise<SubcategoryOption[]> {
  if (!categorySlug) return [];
  const { data } = await api.get<SubcategoryOption[]>(
    "/api/articles/subcategories/",
    { params: { category: categorySlug } }
  );
  return data ?? [];
}

/** GET /api/campuses/ */
export async function getCampusOptions(): Promise<AdminCampusOption[]> {
  const { data } = await api.get<AdminCampusOption[]>("/api/campuses/");
  return data ?? [];
}

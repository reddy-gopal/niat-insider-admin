import api from "@/lib/axios";
import type {
  Article,
  ArticleListItem,
  AuthorLeaderboardItem,
  PaginatedResponse,
} from "@/types/article";

const ADMIN_ARTICLES_BASE = "/api/articles/admin/articles";

export type GetArticlesParams = {
  status?: string
  search?: string
  campus_id?: string
  author_id?: string
  ai_generated?: string
  ordering?: string
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

export async function getAuthorLeaderboard(): Promise<AuthorLeaderboardItem[]> {
  const { data } = await api.get<AuthorLeaderboardItem[]>(`${ADMIN_ARTICLES_BASE}/authors/`);
  return data ?? [];
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

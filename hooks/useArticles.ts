"use client";

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getArticles,
  getArticle,
  updateArticle,
  deleteArticle,
  getAuthorLeaderboard,
} from "@/lib/api/articles";
import type { GetArticlesParams } from "@/lib/api/articles";
import type { ArticleStatus } from "@/types/article";

export function useArticles(params?: GetArticlesParams) {
  return useQuery({
    queryKey: ["articles", params],
    queryFn: () => getArticles(params),
  });
}

/** Infinite scroll: fetches page 1, then next pages on demand. Use fetchNextPage when user scrolls near bottom. */
export function useInfiniteArticles(
  params: Omit<GetArticlesParams, "page"> & { page_size: number }
) {
  return useInfiniteQuery({
    queryKey: ["articles", "infinite", params],
    queryFn: ({ pageParam }) =>
      getArticles({ ...params, page: pageParam, page_size: params.page_size }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.next ? allPages.length + 1 : undefined,
  });
}

export function useArticle(id: string) {
  return useQuery({
    queryKey: ["article", id],
    queryFn: () => getArticle(id),
    enabled: !!id,
  });
}

export function useUpdateArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Parameters<typeof updateArticle>[1]
    }) => updateArticle(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["article", variables.id] });
    },
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
  });
}

export function useBulkUpdateArticles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; status: ArticleStatus }[]) => {
      return Promise.all(
        updates.map(({ id, status }) => updateArticle(id, { status }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
  });
}

export function useAuthorLeaderboard() {
  return useQuery({
    queryKey: ["authors", "leaderboard"],
    queryFn: getAuthorLeaderboard,
  });
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FileX } from "lucide-react";
import {
  useInfiniteArticles,
  useUpdateArticle,
  useDeleteArticle,
  useBulkUpdateArticles,
} from "@/hooks/useArticles";
import { useToast } from "@/hooks/useToast";
import { AdminArticleCard } from "@/components/articles/AdminArticleCard";
import { BulkActionBar } from "@/components/articles/BulkActionBar";
import { Input } from "@/components/ui/input";
import type { ArticleStatus } from "@/types/article";
import { getCampusOptions } from "@/lib/api/articles";
import type { AdminCampusOption } from "@/lib/api/articles";
import { AdminProfileSection } from "@/components/layout/AdminProfileSection";

const PAGE_SIZE = 20;
const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "pending_review", label: "Pending" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
  { value: "draft", label: "Draft" },
] as const;

const STATUS_TOAST: Record<string, string> = {
  published: "Article published",
  pending_review: "Article sent to review",
  rejected: "Article rejected",
  draft: "Article set to draft",
};

export function ArticlesClient() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [campusFilter, setCampusFilter] = useState("");
  const [campuses, setCampuses] = useState<AdminCampusOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [aiFilterActive, setAiFilterActive] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    getCampusOptions()
      .then((list) => {
        if (!cancelled) setCampuses(list);
      })
      .catch(() => {
        if (!cancelled) setCampuses([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const params = {
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(campusFilter ? { campus_id: campusFilter } : {}),
    page_size: PAGE_SIZE,
  };
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteArticles(params);

  // Load next page when sentinel scrolls into view
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage();
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  const updateMutation = useUpdateArticle();
  const deleteMutation = useDeleteArticle();
  const bulkUpdate = useBulkUpdateArticles();
  const { toast } = useToast();

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const results =
    data?.pages.flatMap((p) => p.results) ?? [];
  const displayedArticles = aiFilterActive
    ? results.filter(
        (a) =>
          a.ai_feedback?.status_recommendation &&
          a.ai_feedback.status_recommendation !== a.status
      )
    : results;

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(displayedArticles.map((a) => a.id)));
  }, [displayedArticles]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, []);

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode((on) => {
      if (on) setSelectedIds(new Set());
      return !on;
    });
  }, []);

  const handleBulkPublish = useCallback(async () => {
    const ids = Array.from(selectedIds);
    const count = ids.length;
    try {
      await bulkUpdate.mutateAsync(ids.map((id) => ({ id, status: "published" })));
      toast({ title: `${count} articles published` });
      clearSelection();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } };
      toast({
        title: "Error",
        description: ax.response?.data?.detail ?? "Failed to publish articles",
        variant: "destructive",
      });
    }
  }, [selectedIds, bulkUpdate, toast, clearSelection]);

  const handleBulkReject = useCallback(async () => {
    const ids = Array.from(selectedIds);
    const count = ids.length;
    try {
      await bulkUpdate.mutateAsync(ids.map((id) => ({ id, status: "rejected" })));
      toast({ title: `${count} articles rejected` });
      clearSelection();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } };
      toast({
        title: "Error",
        description: ax.response?.data?.detail ?? "Failed to reject articles",
        variant: "destructive",
      });
    }
  }, [selectedIds, bulkUpdate, toast, clearSelection]);

  const handleStatusChange = useCallback(
    async (id: string, newStatus: ArticleStatus, rejectionReason?: string) => {
      const payload: { status: ArticleStatus; rejection_reason?: string } = {
        status: newStatus,
      };
      if (rejectionReason) payload.rejection_reason = rejectionReason;
      try {
        await updateMutation.mutateAsync({ id, data: payload });
        toast({
          title: STATUS_TOAST[newStatus] ?? "Article updated",
        });
      } catch (err: unknown) {
        const ax = err as { response?: { data?: { detail?: string } } };
        const msg =
          ax.response?.data?.detail ?? "Failed to update article";
        toast({
          title: "Error",
          description: typeof msg === "string" ? msg : "Failed to update article",
          variant: "destructive",
        });
      }
    },
    [updateMutation, toast]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
        toast({ title: "Article deleted" });
      } catch (err: unknown) {
        const ax = err as { response?: { data?: { detail?: string } } };
        const msg = ax.response?.data?.detail ?? "Failed to delete article";
        toast({
          title: "Error",
          description: typeof msg === "string" ? msg : "Failed to delete article",
          variant: "destructive",
        });
      }
    },
    [deleteMutation, toast]
  );

  const count = data?.pages[0]?.count ?? 0;
  const loadedCount = results.length;
  const aiNeedsReviewCount = results.filter(
    (a) =>
      a.ai_feedback?.status_recommendation &&
      a.ai_feedback.status_recommendation !== a.status
  ).length;
  const start = loadedCount > 0 ? 1 : 0;
  const end = loadedCount;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950 px-4 py-4 lg:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={toggleSelectionMode}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                selectionMode
                  ? "bg-[#991b1b] text-white"
                  : "border border-zinc-700 text-zinc-400 hover:border-zinc-500"
              }`}
            >
              {selectionMode ? "✓ Selecting" : "Select"}
            </button>
            {selectionMode && (
              <button
                type="button"
                onClick={selectAll}
                className="text-sm text-zinc-400 underline hover:text-white"
              >
                Select All
              </button>
            )}
            <h1 className="text-xl font-semibold text-white">Articles</h1>
            <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-sm text-zinc-300">
              {isLoading ? "…" : count}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              type="search"
              placeholder="Search by title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 rounded-lg border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder:text-zinc-500"
            />
            <select
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
              className="w-56 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
            >
              <option value="">All campuses</option>
              {campuses.map((campus) => (
                <option key={campus.id} value={campus.id}>
                  {campus.name}
                </option>
              ))}
            </select>
            <div className="flex flex-wrap gap-1">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value || "all"}
                  type="button"
                  onClick={() => setStatusFilter(f.value)}
                  className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                    statusFilter === f.value
                      ? "bg-[#991b1b] text-white"
                      : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAiFilterActive((on) => !on)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  aiFilterActive
                    ? "border-purple-700 bg-purple-900 text-purple-300"
                    : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                ⚡ AI: Needs Review ({aiNeedsReviewCount})
              </button>
            </div>
            <AdminProfileSection />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6 lg:px-6">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl bg-zinc-900 p-5"
              >
                <div className="h-5 w-20 rounded-full bg-zinc-800" />
                <div className="mt-3 h-4 w-3/4 rounded bg-zinc-800" />
                <div className="mt-2 flex gap-2">
                  <div className="h-5 w-24 rounded bg-zinc-800" />
                  <div className="h-5 w-28 rounded bg-zinc-800" />
                </div>
                <div className="mt-2 h-3 w-1/2 rounded bg-zinc-800" />
                <div className="mt-4 flex gap-2">
                  <div className="h-8 flex-1 rounded-lg bg-zinc-800" />
                  <div className="h-8 w-20 rounded-lg bg-zinc-800" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg text-white">Failed to load articles</p>
            <p className="mt-1 text-sm text-zinc-500">
              {(error as Error)?.message ?? "Unknown error"}
            </p>
          </div>
        ) : displayedArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileX className="h-12 w-12 text-zinc-600" />
            <p className="mt-4 text-lg text-white">No articles found</p>
            <p className="mt-1 text-sm text-zinc-500">
              Try changing the filter or search term
            </p>
          </div>
        ) : (
          <>
            <div
              className={`grid gap-4 sm:grid-cols-1 lg:grid-cols-2 ${
                selectionMode ? "pb-20" : ""
              }`}
            >
              {displayedArticles.map((article) => (
                <AdminArticleCard
                  key={article.id}
                  article={article}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                  isSelected={selectedIds.has(article.id)}
                  onSelect={toggleSelect}
                  selectionMode={selectionMode}
                />
              ))}
            </div>
            <BulkActionBar
              selectedCount={selectedIds.size}
              onPublish={handleBulkPublish}
              onReject={handleBulkReject}
              onClear={clearSelection}
              isLoading={bulkUpdate.isPending}
            />

            {/* Pagination / infinite scroll */}
            {count > 0 && (
              <div className="mt-8 flex flex-col items-center gap-4">
                <p className="text-sm text-zinc-500">
                  Showing {start}–{end} of {count} articles
                  {hasNextPage && " — scroll for more"}
                </p>
                <div ref={loadMoreRef} className="min-h-[40px] flex items-center justify-center">
                  {isFetchingNextPage && (
                    <span className="text-sm text-zinc-500">Loading more…</span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useAuthorLeaderboard } from "@/hooks/useArticles";

export default function AuthorsPage() {
  const { data: authors = [], isLoading, isError } = useAuthorLeaderboard();

  return (
    <div className="min-h-screen bg-zinc-950">
      <main className="px-4 py-6 lg:px-6">
        {isLoading ? (
          <p className="text-sm text-zinc-400">Loading authors...</p>
        ) : isError ? (
          <p className="text-sm text-red-400">Failed to load authors.</p>
        ) : authors.length === 0 ? (
          <p className="text-sm text-zinc-400">No user-generated author data found.</p>
        ) : (
          <div className="space-y-3">
            {authors.map((author, idx) => (
              <div
                key={author.id}
                className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-white">
                      #{idx + 1} {author.username}
                    </p>
                    {author.campus_name && author.campus_name !== "Unknown" && (
                      <span className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                        {author.campus_name}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs text-zinc-400">{author.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-[#991b1b]/20 px-2.5 py-1 text-xs font-semibold text-[#fca5a5]">
                    {author.article_count} articles
                  </span>
                  <Link
                    href={`/articles?author_id=${author.id}&ai_generated=false`}
                    className="rounded-md bg-[#991b1b] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#7f1d1d]"
                  >
                    View articles
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

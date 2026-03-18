"use client";

import type { ArticleStatus } from "@/types/article";

const statusConfig: Record<
  ArticleStatus,
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className: "bg-zinc-700 text-zinc-300",
  },
  pending_review: {
    label: "Pending Review",
    className: "bg-yellow-900 text-yellow-300",
  },
  published: {
    label: "Published",
    className: "bg-green-900 text-green-300",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-900 text-red-300",
  },
};

export function StatusBadge({ status }: { status: ArticleStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={`text-xs font-medium px-2.5 py-1 rounded-full ${config.className}`}
    >
      {config.label}
    </span>
  );
}

"use client";

import { cn } from "@/lib/utils";

const RECOMMENDATION_LABELS: Record<string, string> = {
  published: "Publish",
  pending_review: "Review",
  rejected: "Reject",
};

function getColorClass(score: number | null, recommendation: string | null) {
  if (score === null && !recommendation) return "bg-zinc-700 text-zinc-400";
  const rec = recommendation ?? "";
  if (rec === "published") return "bg-green-900/60 text-green-300 border-green-700";
  if (rec === "pending_review") return "bg-yellow-900/60 text-yellow-300 border-yellow-700";
  if (rec === "rejected") return "bg-red-900/60 text-red-300 border-red-700";
  if (score !== null) {
    if (score >= 70) return "bg-green-900/60 text-green-300 border-green-700";
    if (score >= 40) return "bg-yellow-900/60 text-yellow-300 border-yellow-700";
    return "bg-red-900/60 text-red-300 border-red-700";
  }
  return "bg-zinc-700 text-zinc-400";
}

type AIScoreBadgeProps = {
  score: number | null;
  recommendation: string | null;
  className?: string;
};

export function AIScoreBadge({
  score,
  recommendation,
  className,
}: AIScoreBadgeProps) {
  // Backend may return 0–1 (float) or 0–100; normalize to 0–100 for display
  const scorePercent =
    score != null
      ? score <= 1
        ? Math.round(score * 100)
        : Math.round(score)
      : null;

  const displayLabel =
    scorePercent === null && !recommendation
      ? "No AI Review"
      : scorePercent !== null && recommendation
        ? `AI: ${scorePercent}% · ${RECOMMENDATION_LABELS[recommendation] ?? recommendation}`
        : scorePercent !== null
          ? `AI: ${scorePercent}%`
          : "No AI Review";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        getColorClass(scorePercent, recommendation),
        className
      )}
    >
      {displayLabel}
    </span>
  );
}

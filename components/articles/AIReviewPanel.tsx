"use client";

import { useState } from "react";
import type { Article, ArticleStatus } from "@/types/article";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Backend returns 0–1; normalize to 0–100 for display and bar width */
function toPct(n: number): number {
  return n <= 1 ? Math.round(n * 100) : Math.round(n);
}

type AIReviewPanelProps = {
  feedback: Article["ai_feedback"];
  reviewedAt: string | null;
  articleId: string;
  currentStatus: ArticleStatus;
  onStatusChange: (id: string, status: string, reason?: string) => void;
};

function RecommendationBanner({
  recommendation,
  statusReason,
  articleId,
  currentStatus,
  onStatusChange,
}: {
  recommendation: "published" | "pending_review" | "rejected";
  statusReason: string;
  articleId: string;
  currentStatus: ArticleStatus;
  onStatusChange: (id: string, status: string, reason?: string) => void;
}) {
  if (recommendation === currentStatus) {
    return (
      <p className="text-xs text-zinc-500">
        ✓ Status already matches AI recommendation
      </p>
    );
  }

  if (recommendation === "published") {
    return (
      <div className="rounded-xl border border-green-700 bg-green-900/40 p-4">
        <p className="font-medium text-green-300">✓ Gemini recommends publishing</p>
        <p className="mt-1 text-sm italic text-green-400/80">{statusReason}</p>
        <Button
          type="button"
          className="mt-3 bg-green-600 text-sm text-white hover:bg-green-500"
          onClick={() => onStatusChange(articleId, "published")}
        >
          Apply — Publish Article
        </Button>
      </div>
    );
  }

  if (recommendation === "pending_review") {
    return (
      <div className="rounded-xl border border-yellow-700 bg-yellow-900/40 p-4">
        <p className="font-medium text-yellow-300">⚠ Gemini suggests further review</p>
        <p className="mt-1 text-sm italic text-yellow-400/80">{statusReason}</p>
        <Button
          type="button"
          className="mt-3 bg-yellow-600 text-sm text-white hover:bg-yellow-500"
          onClick={() => onStatusChange(articleId, "pending_review")}
        >
          Apply — Send to Review
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-red-700 bg-red-900/40 p-4">
      <p className="font-medium text-red-300">✗ Gemini recommends rejecting</p>
      <p className="mt-1 text-sm italic text-red-400/80">{statusReason}</p>
      <Button
        type="button"
        className="mt-3 bg-red-700 text-sm text-white hover:bg-red-600"
        onClick={() => onStatusChange(articleId, "rejected")}
      >
        Apply — Reject Article
      </Button>
    </div>
  );
}

export function AIReviewPanel({
  feedback,
  reviewedAt,
  articleId,
  currentStatus,
  onStatusChange,
}: AIReviewPanelProps) {
  if (!feedback) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="text-sm text-zinc-500">No AI review yet.</p>
      </div>
    );
  }

  const {
    confidence_score,
    brand_alignment,
    content_quality,
    tone_score,
    summary,
    status_recommendation,
    status_reason,
    strengths,
    concerns,
    flags,
  } = feedback;

  const scoreSummary = `Confidence: ${toPct(confidence_score)}% · Brand: ${toPct(brand_alignment)}% · Quality: ${toPct(content_quality)}% · Tone: ${toPct(tone_score)}%`;

  return (
    <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <RecommendationBanner
        recommendation={status_recommendation}
        statusReason={status_reason}
        articleId={articleId}
        currentStatus={currentStatus}
        onStatusChange={onStatusChange}
      />

      <p className="font-mono text-xs text-zinc-400">
        {scoreSummary.split(" · ").map((part, i) => (
          <span key={part}>
            {i > 0 && <span className="text-zinc-600"> · </span>}
            {part}
          </span>
        ))}
      </p>

      <div className="flex gap-4">
        <div className="flex-1 space-y-1">
          <p className="text-xs font-medium text-zinc-500">Confidence</p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className={cn(
                "h-full rounded-full",
                toPct(confidence_score) >= 70 ? "bg-green-600" : toPct(confidence_score) >= 40 ? "bg-yellow-600" : "bg-red-600"
              )}
              style={{ width: `${Math.min(100, Math.max(0, toPct(confidence_score)))}%` }}
            />
          </div>
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-xs font-medium text-zinc-500">Brand</p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-zinc-500"
              style={{ width: `${Math.min(100, Math.max(0, toPct(brand_alignment)))}%` }}
            />
          </div>
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-xs font-medium text-zinc-500">Quality</p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-zinc-500"
              style={{ width: `${Math.min(100, Math.max(0, toPct(content_quality)))}%` }}
            />
          </div>
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-xs font-medium text-zinc-500">Tone</p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-zinc-500"
              style={{ width: `${Math.min(100, Math.max(0, toPct(tone_score)))}%` }}
            />
          </div>
        </div>
      </div>

      {summary && (
        <div>
          <p className="text-xs font-medium text-zinc-500">Summary</p>
          <p className="mt-0.5 text-sm text-zinc-300">{summary}</p>
        </div>
      )}

      {strengths?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-zinc-500">Strengths</p>
          <ul className="mt-0.5 list-inside list-disc text-sm text-zinc-300">
            {strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {concerns?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-zinc-500">Concerns</p>
          <ul className="mt-0.5 list-inside list-disc text-sm text-zinc-300">
            {concerns.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {flags && (flags.contains_fees || flags.off_topic || flags.promotional || flags.low_quality) && (
        <div className="flex flex-wrap gap-2">
          {flags.contains_fees && (
            <span className="rounded bg-amber-900/50 px-2 py-0.5 text-xs text-amber-300">Contains fees</span>
          )}
          {flags.off_topic && (
            <span className="rounded bg-amber-900/50 px-2 py-0.5 text-xs text-amber-300">Off topic</span>
          )}
          {flags.promotional && (
            <span className="rounded bg-amber-900/50 px-2 py-0.5 text-xs text-amber-300">Promotional</span>
          )}
          {flags.low_quality && (
            <span className="rounded bg-amber-900/50 px-2 py-0.5 text-xs text-amber-300">Low quality</span>
          )}
        </div>
      )}

      {reviewedAt && (
        <p className="text-xs text-zinc-500">
          AI reviewed: {new Date(reviewedAt).toLocaleString()}
        </p>
      )}

      <FullGeminiResponse feedback={feedback} />
    </div>
  );
}

function FullGeminiResponse({ feedback }: { feedback: NonNullable<Article["ai_feedback"]> }) {
  const [open, setOpen] = useState(false);
  const rawJson = JSON.stringify(feedback, null, 2);
  return (
    <div className="border-t border-zinc-800 pt-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs font-medium text-zinc-400 hover:text-white"
      >
        {open ? "▼ Hide" : "▶ Show"} full Gemini response
      </button>
      {open && (
        <pre className="mt-2 max-h-[400px] overflow-auto rounded-lg border border-zinc-700 bg-zinc-950 p-3 font-mono text-xs text-zinc-300 whitespace-pre-wrap break-words">
          {rawJson}
        </pre>
      )}
    </div>
  );
}

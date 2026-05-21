"use client";

import { useState } from "react";
import Link from "next/link";
import { parseISO, format } from "date-fns";
import { useAuthorLeaderboard } from "@/hooks/useArticles";

export default function AuthorsPage() {
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Only fetch if both dates are set, or both are null
  const shouldFetch = (fromDate && toDate) || (!fromDate && !toDate);
  const { data: leaderboardData, isLoading, isError } = useAuthorLeaderboard(
    shouldFetch ? fromDate : null,
    shouldFetch ? toDate : null
  );
  
  const authors = leaderboardData?.authors || [];
  const period = leaderboardData?.period;

  const handleFromDateChange = (value: string) => {
    const newFromDate = value || null;
    setFromDate(newFromDate);
    
    // Validate date range
    if (newFromDate && newFromDate > today) {
      setDateError("From date cannot be in the future");
    } else if (newFromDate && toDate && newFromDate > toDate) {
      setDateError("From date must be before to date");
    } else {
      setDateError(null);
    }
  };

  const handleToDateChange = (value: string) => {
    const newToDate = value || null;
    setToDate(newToDate);
    
    // Validate date range
    if (newToDate && newToDate > today) {
      setDateError("To date cannot be in the future");
    } else if (fromDate && newToDate && fromDate > newToDate) {
      setDateError("From date must be before to date");
    } else {
      setDateError(null);
    }
  };

  const handleClearDates = () => {
    setFromDate(null);
    setToDate(null);
    setDateError(null);
  };

  const getPeriodLabel = () => {
    if (!fromDate && !toDate) {
      return "All Time Leaderboard";
    }
    if (fromDate && toDate) {
      return `Leaderboard (${format(parseISO(fromDate), "MMM d")} - ${format(parseISO(toDate), "MMM d, yyyy")})`;
    }
    return "Leaderboard";
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <main className="px-4 py-6 lg:px-6">
        {/* Period Title */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-white">{getPeriodLabel()}</h1>
          <p className="mt-1 text-sm text-zinc-400">Authors by articles submitted</p>
        </div>

        {/* Date Range Filters */}
        <div className="mb-6 flex flex-col gap-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
            <button
              onClick={handleClearDates}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                !fromDate && !toDate
                  ? "bg-[#991b1b] text-white"
                  : "border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              All Time
            </button>
            <div className="flex flex-col">
              <label className="mb-1 text-xs font-semibold text-zinc-300">From Date</label>
              <input
                type="date"
                max={today}
                value={fromDate || ""}
                onChange={(e) => handleFromDateChange(e.target.value)}
                className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-xs font-semibold text-zinc-300">To Date</label>
              <input
                type="date"
                max={today}
                value={toDate || ""}
                onChange={(e) => handleToDateChange(e.target.value)}
                className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500"
              />
            </div>
            {(fromDate || toDate) && (
              <button
                onClick={handleClearDates}
                className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700"
              >
                Clear
              </button>
            )}
          </div>
          
          {/* Error Messages */}
          {dateError && (
            <p className="text-xs text-red-400">{dateError}</p>
          )}
          {!shouldFetch && (
            <p className="text-xs text-yellow-400">Please select both From Date and To Date, or use All Time</p>
          )}
        </div>

        {isLoading ? (
          <p className="text-sm text-zinc-400">Loading leaderboard...</p>
        ) : !shouldFetch ? (
          <p className="text-sm text-zinc-400">Select both From Date and To Date to view filtered results</p>
        ) : isError ? (
          <p className="text-sm text-red-400">Failed to load leaderboard.</p>
        ) : authors.length === 0 ? (
          <p className="text-sm text-zinc-400">No authors found for this period.</p>
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
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <div className="flex flex-col gap-1">
                    {(fromDate || toDate) && (
                      <span className="rounded-full bg-[#1e3a8a]/30 px-2.5 py-1 text-xs font-semibold text-[#93c5fd]">
                        {author.articles_in_period} in period
                      </span>
                    )}
                    <span className="rounded-full bg-[#991b1b]/20 px-2.5 py-1 text-xs font-semibold text-[#fca5a5]">
                      {author.total_articles} total
                    </span>
                  </div>
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

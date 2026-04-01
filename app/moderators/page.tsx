"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Loader2, Shield, UserPlus, UserX } from "lucide-react";
import {
  useAssignModerator,
  useModerators,
  useRemoveModerator,
  useUpdateModerator,
} from "@/hooks/useModerators";
import { useToast } from "@/hooks/useToast";
import { AdminProfileSection } from "@/components/layout/AdminProfileSection";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function extractError(error: unknown, fallback: string) {
  const e = error as {
    response?: { data?: { detail?: string } | Record<string, unknown> };
    message?: string;
  };
  const data = e?.response?.data;
  if (data && typeof data === "object") {
    if ("detail" in data && typeof data.detail === "string") return data.detail;
    const firstKey = Object.keys(data)[0];
    const firstVal = (data as Record<string, unknown>)[firstKey];
    if (Array.isArray(firstVal) && typeof firstVal[0] === "string") return firstVal[0];
    if (typeof firstVal === "string") return firstVal;
  }
  return e?.message || fallback;
}

export default function ModeratorsPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"" | "true" | "false">("");
  const [identifier, setIdentifier] = useState("");

  const { toast } = useToast();
  const { data, isLoading, isError, error } = useModerators({
    search: search.trim() || undefined,
    is_active: activeFilter || undefined,
    page_size: 50,
  });
  const assignMutation = useAssignModerator();
  const updateMutation = useUpdateModerator();
  const removeMutation = useRemoveModerator();

  const moderators = data?.results ?? [];

  const handleAssign = async (e: FormEvent) => {
    e.preventDefault();
    const value = identifier.trim();
    if (!value) {
      toast({
        title: "Identifier required",
        description: "Enter username, email, phone number, or user UUID.",
        variant: "destructive",
      });
      return;
    }

    const payload: {
      user_id?: string;
      username?: string;
      email?: string;
      phone_number?: string;
    } = {};

    if (/^[0-9a-fA-F-]{36}$/.test(value)) {
      payload.user_id = value;
    } else if (value.includes("@")) {
      payload.email = value;
    } else if (value.startsWith("+") || /\d{7,}/.test(value)) {
      payload.phone_number = value;
    } else {
      payload.username = value;
    }

    try {
      await assignMutation.mutateAsync(payload);
      setIdentifier("");
      toast({ title: "Moderator assigned" });
    } catch (err) {
      toast({
        title: "Failed to assign moderator",
        description: extractError(err, "Please verify the identifier and try again."),
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: string, is_active: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, is_active: !is_active });
      toast({ title: !is_active ? "Moderator activated" : "Moderator deactivated" });
    } catch (err) {
      toast({
        title: "Unable to update moderator",
        description: extractError(err, "Please try again."),
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (id: string, username: string) => {
    const confirmed = window.confirm(`Remove ${username} from moderators?`);
    if (!confirmed) return;
    try {
      await removeMutation.mutateAsync(id);
      toast({ title: "Moderator removed" });
    } catch (err) {
      toast({
        title: "Failed to remove moderator",
        description: extractError(err, "Please try again."),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950 px-4 py-4 lg:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/articles"
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:border-zinc-500 hover:text-white"
            >
              Articles
            </Link>
            <Link
              href="/authors"
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:border-zinc-500 hover:text-white"
            >
              Authors
            </Link>
            <span className="rounded-lg bg-[#991b1b] px-3 py-1.5 text-sm font-medium text-white">
              Moderators
            </span>
            <h1 className="ml-1 text-xl font-semibold text-white">Manage Moderators</h1>
          </div>
          <AdminProfileSection />
        </div>
      </header>

      <main className="px-4 py-6 lg:px-6">
        <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="mb-3 flex items-center gap-2 text-zinc-200">
            <UserPlus className="h-4 w-4 text-[#fca5a5]" />
            <h2 className="text-sm font-semibold uppercase tracking-wide">Add Moderator</h2>
          </div>
          <form onSubmit={handleAssign} className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Username, email, phone, or user UUID"
              className="border-zinc-700 bg-zinc-950 text-white placeholder:text-zinc-500"
            />
            <Button
              type="submit"
              className="bg-[#991b1b] text-white hover:bg-[#7f1d1d]"
              disabled={assignMutation.isPending}
            >
              {assignMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Assign
            </Button>
          </form>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#fca5a5]" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-200">
                Moderator Accounts
              </h2>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                {isLoading ? "..." : data?.count ?? 0}
              </span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search username, email, phone"
                className="w-full border-zinc-700 bg-zinc-950 text-white placeholder:text-zinc-500 sm:w-72"
              />
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value as "" | "true" | "false")}
                className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
              >
                <option value="">All statuses</option>
                <option value="true">Active only</option>
                <option value="false">Inactive only</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading moderators...
            </div>
          ) : isError ? (
            <p className="py-6 text-sm text-red-400">
              {extractError(error, "Failed to load moderators.")}
            </p>
          ) : moderators.length === 0 ? (
            <p className="py-8 text-sm text-zinc-400">No moderators found for this filter.</p>
          ) : (
            <div className="space-y-3">
              {moderators.map((moderator) => (
                <div
                  key={moderator.id}
                  className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-white">{moderator.username}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          moderator.is_active
                            ? "bg-emerald-900/30 text-emerald-300"
                            : "bg-zinc-800 text-zinc-300"
                        }`}
                      >
                        {moderator.is_active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>
                    <p className="truncate text-xs text-zinc-400">
                      {moderator.email || "No email"} • {moderator.phone_number || "No phone"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Joined {new Date(moderator.date_joined).toLocaleDateString()} • Last login{" "}
                      {moderator.last_login
                        ? new Date(moderator.last_login).toLocaleString()
                        : "Never"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
                      disabled={updateMutation.isPending}
                      onClick={() => handleToggleActive(moderator.id, moderator.is_active)}
                    >
                      {moderator.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-red-900/60 bg-red-950/30 text-red-300 hover:bg-red-900/30"
                      disabled={removeMutation.isPending}
                      onClick={() => handleRemove(moderator.id, moderator.username)}
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

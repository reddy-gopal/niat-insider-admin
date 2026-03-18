"use client";

import { useEffect, useState } from "react";
import { LogOut, UserCircle2 } from "lucide-react";
import api from "@/lib/axios";

type MeResponse = {
  username?: string;
  email?: string | null;
  role?: string;
};

export function AdminProfileSection() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get<MeResponse>("/api/auth/me/")
      .then((res) => {
        if (!cancelled) setMe(res.data ?? null);
      })
      .catch(() => {
        if (!cancelled) setMe(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_refresh_token");
    document.cookie = "admin_access_token=; path=/; max-age=0";
    window.location.href = "/login";
  };

  const roleLabel = (me?.role || "admin").toUpperCase();

  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2">
      <UserCircle2 className="h-4 w-4 text-zinc-400" />
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-zinc-200">
          {loading ? "Loading..." : me?.username || "Admin"}
        </p>
        <p className="truncate text-[11px] text-zinc-500">{roleLabel}</p>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
        title="Logout"
      >
        <LogOut className="h-3.5 w-3.5" />
        Logout
      </button>
    </div>
  );
}


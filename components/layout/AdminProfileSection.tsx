"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, User } from "lucide-react";
import api from "@/lib/axios";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const username = loading ? "Admin" : me?.username || "Admin";
  const initials = username.trim().slice(0, 1).toUpperCase() || "A";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-1 py-1 pr-2 text-zinc-200 hover:bg-zinc-800"
          aria-label="Open profile menu"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#991b1b] text-xs font-semibold text-white">
            {initials}
          </span>
          <ChevronDown className="h-4 w-4 text-zinc-400" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 border-zinc-800 bg-zinc-900 text-zinc-100">
        <DropdownMenuLabel className="px-3 py-2">
          <p className="truncate text-sm font-medium">{username}</p>
          <p className="truncate text-xs text-zinc-500">{roleLabel}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-800" />
        <DropdownMenuItem asChild className="cursor-pointer text-zinc-200 focus:bg-zinc-800 focus:text-white">
          <Link href="/profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={handleLogout}
          className="cursor-pointer text-red-300 focus:bg-zinc-800 focus:text-red-200"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


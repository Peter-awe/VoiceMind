"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { LogOut, Settings, Crown, CreditCard } from "lucide-react";

export function UserMenu() {
  const { user, profile, loading, signOut, isPro } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse" />
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="text-sm text-slate-400 hover:text-white transition"
        >
          Sign In
        </Link>
        <Link
          href="/signup"
          className="text-sm px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition font-medium"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  // Logged in
  const initials = (user.email || "U")[0].toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 hover:opacity-80 transition"
      >
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
            isPro
              ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white"
              : "bg-slate-700 text-slate-300"
          }`}
        >
          {initials}
        </div>
        {isPro && (
          <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
            <Crown className="w-3 h-3" />
            Pro
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-slate-700 bg-slate-800 shadow-xl overflow-hidden z-50">
          {/* User info */}
          <div className="p-4 border-b border-slate-700">
            <p className="text-sm font-medium text-white truncate">
              {profile?.display_name || user.email}
            </p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isPro
                    ? "bg-amber-400/10 text-amber-400"
                    : "bg-slate-700 text-slate-400"
                }`}
              >
                {isPro ? "Pro" : "Free"}
              </span>
              {profile?.subscription_tier === "pro" &&
                profile.stt_hours_used !== undefined && (
                  <span className="text-xs text-slate-500">
                    {(10 - (profile.stt_hours_used || 0)).toFixed(1)}h STT
                    remaining
                  </span>
                )}
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            {!isPro && (
              <Link
                href="/#pricing"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-amber-400 hover:bg-slate-700/50 transition"
              >
                <Crown className="w-4 h-4" />
                Upgrade to Pro
              </Link>
            )}
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 transition"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
            {isPro && (
              <button
                onClick={async () => {
                  setOpen(false);
                  // Redirect to Stripe portal
                  const res = await fetch("/api/stripe/portal", {
                    method: "POST",
                  });
                  const { url } = await res.json();
                  if (url) window.location.href = url;
                }}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 transition w-full text-left"
              >
                <CreditCard className="w-4 h-4" />
                Manage Subscription
              </button>
            )}
          </div>

          {/* Sign out */}
          <div className="border-t border-slate-700 py-1">
            <button
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-slate-700/50 transition w-full text-left"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

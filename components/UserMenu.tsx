"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/i18n";
import Link from "next/link";
import { LogOut, Settings, Crown, CreditCard, Sparkles } from "lucide-react";

export function UserMenu() {
  const { user, session, profile, loading, signOut, isPro, isPlus, isPaid, tier } =
    useAuth();
  const { t } = useLocale();
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
          {t.nav.signIn}
        </Link>
        <Link
          href="/signup"
          className="text-sm px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition font-medium"
        >
          {t.nav.signUp}
        </Link>
      </div>
    );
  }

  // Logged in
  const initials = (user.email || "U")[0].toUpperCase();
  const tierLabel = isPro ? "Pro Max" : isPlus ? "Plus" : "Free";
  const tierBadgeClass = isPro
    ? "bg-amber-400/10 text-amber-400"
    : isPlus
    ? "bg-emerald-400/10 text-emerald-400"
    : "bg-slate-700 text-slate-400";
  const avatarClass = isPro
    ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white"
    : isPlus
    ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
    : "bg-slate-700 text-slate-300";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 hover:opacity-80 transition"
      >
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${avatarClass}`}
        >
          {initials}
        </div>
        {isPaid && (
          <span
            className={`hidden sm:inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${tierBadgeClass}`}
          >
            {isPro ? (
              <Crown className="w-3 h-3" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            {tierLabel}
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
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${tierBadgeClass}`}
              >
                {tierLabel}
              </span>
              {isPro && profile?.stt_hours_used !== undefined && (
                <span className="text-xs text-slate-500">
                  {(10 - (profile.stt_hours_used || 0)).toFixed(1)}h{" "}
                  {t.userMenu.sttRemaining}
                </span>
              )}
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            {/* Free user → show upgrade to Plus (link to pricing) */}
            {tier === "free" && (
              <Link
                href="/#pricing"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-emerald-400 hover:bg-slate-700/50 transition w-full text-left"
              >
                <Sparkles className="w-4 h-4" />
                {t.userMenu.upgradePlus}
              </Link>
            )}
            {/* Plus user → show upgrade to Pro Max */}
            {isPlus && (
              <button
                onClick={async () => {
                  setOpen(false);
                  if (!user || !session?.access_token) return;
                  const res = await fetch("/api/stripe/checkout", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({ plan: "pro_monthly" }),
                  });
                  const { url } = await res.json();
                  if (url) window.location.href = url;
                }}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-amber-400 hover:bg-slate-700/50 transition w-full text-left"
              >
                <Crown className="w-4 h-4" />
                {t.userMenu.upgradePro}
              </button>
            )}
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 transition"
            >
              <Settings className="w-4 h-4" />
              {t.userMenu.settings}
            </Link>
            {isPaid && (
              <button
                onClick={async () => {
                  setOpen(false);
                  const res = await fetch("/api/stripe/portal", {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${session?.access_token}`,
                    },
                  });
                  const { url } = await res.json();
                  if (url) window.location.href = url;
                }}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 transition w-full text-left"
              >
                <CreditCard className="w-4 h-4" />
                {t.userMenu.manageSubscription}
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
              {t.userMenu.signOut}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// NavBar — Bilingual navigation bar (client component)
// Extracted from layout.tsx to support i18n via useLocale()
// ============================================================

"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n";
import { UserMenu } from "./UserMenu";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";

export function NavBar() {
  const { t } = useLocale();

  return (
    <nav className="h-14 border-b backdrop-blur-sm flex items-center px-6 sticky top-0 z-50" style={{ backgroundColor: "var(--nav-bg)", borderColor: "var(--border)" }}>
      <Link href="/" className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
        KiwiPenNotes
      </Link>
      <div className="flex gap-6 ml-8">
        <Link
          href="/#features"
          className="text-sm transition hidden md:block" style={{ color: "var(--text-secondary)" }}
        >
          {t.nav.features}
        </Link>
        <Link
          href="/#pricing"
          className="text-sm transition hidden md:block" style={{ color: "var(--text-secondary)" }}
        >
          {t.nav.pricing}
        </Link>
        <Link
          href="/download"
          className="text-sm transition hidden md:block" style={{ color: "var(--text-secondary)" }}
        >
          {t.nav.download}
        </Link>
        <span className="hidden md:block" style={{ color: "var(--border)" }}>|</span>
        <Link
          href="/record"
          className="text-sm transition hidden md:block" style={{ color: "var(--text-secondary)" }}
        >
          {t.nav.record}
        </Link>
        <Link
          href="/library"
          className="text-sm transition hidden md:block" style={{ color: "var(--text-secondary)" }}
        >
          {t.nav.library}
        </Link>
        <Link
          href="/settings"
          className="text-sm transition hidden md:block" style={{ color: "var(--text-secondary)" }}
        >
          {t.nav.settings}
        </Link>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle />
        <LanguageToggle />
        <UserMenu />
      </div>
    </nav>
  );
}

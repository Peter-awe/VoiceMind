// ============================================================
// NavBar — Bilingual navigation bar (client component)
// Extracted from layout.tsx to support i18n via useLocale()
// ============================================================

"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n";
import { UserMenu } from "./UserMenu";
import { LanguageToggle } from "./LanguageToggle";

export function NavBar() {
  const { t } = useLocale();

  return (
    <nav className="h-14 border-b border-slate-700 bg-slate-800/90 backdrop-blur-sm flex items-center px-6 sticky top-0 z-50">
      <Link href="/" className="text-lg font-semibold text-white">
        KiwiPenNotes
      </Link>
      <div className="flex gap-6 ml-8">
        <Link
          href="/#features"
          className="text-sm text-slate-400 hover:text-white transition hidden md:block"
        >
          {t.nav.features}
        </Link>
        <Link
          href="/#pricing"
          className="text-sm text-slate-400 hover:text-white transition hidden md:block"
        >
          {t.nav.pricing}
        </Link>
        <Link
          href="/download"
          className="text-sm text-slate-400 hover:text-white transition hidden md:block"
        >
          {t.nav.download}
        </Link>
        <span className="text-slate-600 hidden md:block">|</span>
        <Link
          href="/record"
          className="text-sm text-slate-400 hover:text-white transition hidden md:block"
        >
          {t.nav.record}
        </Link>
        <Link
          href="/library"
          className="text-sm text-slate-400 hover:text-white transition hidden md:block"
        >
          {t.nav.library}
        </Link>
        <Link
          href="/settings"
          className="text-sm text-slate-400 hover:text-white transition hidden md:block"
        >
          {t.nav.settings}
        </Link>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <LanguageToggle />
        <UserMenu />
      </div>
    </nav>
  );
}

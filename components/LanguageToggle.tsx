// ============================================================
// LanguageToggle — EN/ZH toggle button for the navbar
// ============================================================

"use client";

import { Globe } from "lucide-react";
import { useLocale, type Locale } from "@/lib/i18n";

export function LanguageToggle() {
  const { locale, setLocale } = useLocale();

  const toggle = () => {
    const next: Locale = locale === "en" ? "zh" : "en";
    setLocale(next);
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700/60 transition-all"
      title={locale === "en" ? "切换中文" : "Switch to English"}
    >
      <Globe className="w-3.5 h-3.5" />
      {locale === "en" ? "中文" : "EN"}
    </button>
  );
}

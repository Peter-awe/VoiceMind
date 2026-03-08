"use client";

import { useState } from "react";
import {
  Mic,
  Languages,
  Brain,
  FileText,
  Globe,
  Zap,
  Shield,
  ChevronRight,
  Check,
  X,
  Monitor,
  Smartphone,
  Chrome,
  Apple,
  Loader2,
  Crown,
  Download,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/i18n";

const FEATURE_ICONS = [Mic, Languages, Brain, FileText, Globe, Shield];
const FEATURE_COLORS = [
  "text-blue-400",
  "text-emerald-400",
  "text-purple-400",
  "text-amber-400",
  "text-cyan-400",
  "text-green-400",
];

export default function LandingPage() {
  const { user, session } = useAuth();
  const { t, locale } = useLocale();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly"
  );

  const handleCheckout = async (plan: string) => {
    if (!user || !session?.access_token) {
      window.location.href = "/signup";
      return;
    }
    setCheckoutLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      window.location.href = "/signup";
    }
    setCheckoutLoading(null);
  };

  return (
    <div className="min-h-screen">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        <div className="hero-glow top-[-200px] left-1/2 -translate-x-1/2" />

        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center relative z-10">
          {/* Badge */}
          <div className="fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs text-blue-300 font-medium">
              {t.hero.badge}
            </span>
          </div>

          {/* Headline */}
          <h1 className="fade-up-delay-1 text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            {t.hero.title1}
            <br />
            <span className="gradient-text">{t.hero.title2}</span>
          </h1>

          {/* Subheadline */}
          <p className="fade-up-delay-2 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t.hero.subtitle}
          </p>

          {/* CTA Buttons */}
          <div className="fade-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/record"
              className="btn-shimmer px-8 py-4 rounded-xl text-white font-semibold text-lg flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-shadow"
            >
              <Chrome className="w-5 h-5" />
              {t.hero.ctaBrowser}
              <ChevronRight className="w-4 h-4" />
            </a>
            <a
              href="/download"
              className="px-8 py-4 rounded-xl bg-slate-800 border border-slate-600 text-white font-semibold text-lg flex items-center gap-2 hover:bg-slate-700 transition"
            >
              <Apple className="w-5 h-5" />
              {t.hero.ctaMacOS}
            </a>
          </div>

          {/* Trust line */}
          <p className="mt-6 text-xs text-slate-500">{t.hero.trustLine}</p>
        </div>
      </section>

      {/* ===== DEMO PREVIEW ===== */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden shadow-2xl shadow-black/30">
          {/* Fake window bar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-slate-700">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-amber-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
            <span className="ml-3 text-xs text-slate-500">{t.demo.title}</span>
          </div>

          {/* Mock three-panel layout */}
          <div className="grid grid-cols-3 h-64 md:h-80">
            {/* Transcript panel */}
            <div className="col-span-2 border-r border-slate-700 p-4 space-y-3 overflow-hidden">
              <div className="flex border-b border-slate-700/50 pb-2 mb-2">
                <span className="flex-1 text-xs text-slate-500 uppercase tracking-wider">
                  {t.demo.transcript}
                </span>
                <span className="flex-1 text-xs text-slate-500 uppercase tracking-wider">
                  {t.demo.translation}
                </span>
              </div>
              {[
                {
                  en: "Let's discuss the experiment results from last week.",
                  zh: "\u8BA9\u6211\u4EEC\u8BA8\u8BBA\u4E0A\u5468\u7684\u5B9E\u9A8C\u7ED3\u679C\u3002",
                },
                {
                  en: "The control group showed a 15% improvement.",
                  zh: "\u5BF9\u7167\u7EC4\u663E\u793A\u4E8615%\u7684\u6539\u5584\u3002",
                },
                {
                  en: "We should adjust the sample size for phase two.",
                  zh: "\u6211\u4EEC\u5E94\u8BE5\u8C03\u6574\u7B2C\u4E8C\u9636\u6BB5\u7684\u6837\u672C\u91CF\u3002",
                },
              ].map((row, i) => (
                <div
                  key={i}
                  className="flex gap-4 segment-enter"
                  style={{
                    animationDelay: `${i * 0.3 + 0.5}s`,
                    opacity: 0,
                    animationFillMode: "forwards",
                  }}
                >
                  <p className="flex-1 text-sm text-slate-300">{row.en}</p>
                  <p className="flex-1 text-sm text-emerald-300">{row.zh}</p>
                </div>
              ))}
              <div className="flex gap-4 opacity-50">
                <p className="flex-1 text-sm text-slate-500 italic">
                  {t.demo.interim}
                </p>
                <p className="flex-1 text-sm text-slate-600">...</p>
              </div>
            </div>

            {/* Analysis panel */}
            <div className="p-4 space-y-3 overflow-hidden">
              <div className="text-xs text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-700/50">
                {t.demo.aiAnalysis}
              </div>
              <div className="bg-slate-700/40 rounded-lg p-3 border border-slate-600/30 text-xs text-slate-300 leading-relaxed">
                <p className="font-medium text-blue-300 mb-1">
                  {t.demo.keyInsights}
                </p>
                <p>&bull; Control group: +15% improvement</p>
                <p>&bull; Action: Adjust sample size</p>
                <p>&bull; Consider statistical power analysis</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t.features.title}
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            {t.features.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.features.cards.map((card, i) => {
            const Icon = FEATURE_ICONS[i];
            return (
              <div key={i} className="feature-card">
                <Icon className={`w-10 h-10 ${FEATURE_COLORS[i]} mb-4`} />
                <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {card.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="border-y border-slate-800 bg-slate-800/20 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            {t.howItWorks.title}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {t.howItWorks.steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold text-blue-400">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PLATFORMS ===== */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          {t.platforms.title}
        </h2>
        <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">
          {t.platforms.subtitle}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="feature-card text-center">
            <Chrome className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              {t.platforms.web.name}
            </h3>
            <p className="text-xs text-green-400 font-medium mb-3">
              {t.platforms.web.status}
            </p>
            <p className="text-sm text-slate-400 mb-4">
              {t.platforms.web.desc}
            </p>
            <a
              href="/record"
              className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300"
            >
              {t.platforms.web.cta} <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="feature-card text-center border-blue-500/30">
            <Monitor className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              {t.platforms.macos.name}
            </h3>
            <p className="text-xs text-amber-400 font-medium mb-3">
              {t.platforms.macos.status}
            </p>
            <p className="text-sm text-slate-400 mb-4">
              {t.platforms.macos.desc}
            </p>
            <a
              href="/download"
              className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-300"
            >
              <Download className="w-3.5 h-3.5" /> {t.platforms.macos.cta}
            </a>
          </div>

          <div className="feature-card text-center">
            <Smartphone className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              {t.platforms.ios.name}
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-3">
              {t.platforms.ios.status}
            </p>
            <p className="text-sm text-slate-400 mb-4">
              {t.platforms.ios.desc}
            </p>
            <span className="text-sm text-slate-600">
              {t.platforms.ios.cta}
            </span>
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section
        id="pricing"
        className="border-y border-slate-800 bg-slate-800/20 py-20"
      >
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            {t.pricing.title}
          </h2>
          <p className="text-slate-400 text-center mb-10 max-w-xl mx-auto">
            {t.pricing.subtitle}
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className="flex items-center justify-center mb-12">
            <div className="inline-flex bg-slate-800 border border-slate-700 rounded-full p-1">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  billingPeriod === "monthly"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {t.pricing.monthly}
              </button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  billingPeriod === "yearly"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {t.pricing.yearly}
                <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-semibold">
                  {t.pricing.saveMonths}
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto items-start">
            {/* ── Free Tier ── */}
            <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-8 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-2xl font-bold">{t.pricing.free.name}</h3>
                <span className="px-2.5 py-0.5 bg-blue-500/15 text-blue-300 text-[10px] rounded-full font-semibold uppercase tracking-wider">
                  {t.pricing.free.badge}
                </span>
              </div>
              <div className="mb-1">
                <span className="text-4xl font-bold">
                  {t.pricing.free.price}
                </span>
                <span className="text-sm text-slate-500 ml-2">
                  {t.pricing.forever}
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-6 min-h-[20px]">
                {t.pricing.free.desc}
              </p>
              <ul className="space-y-3 mb-8 flex-grow">
                {t.pricing.free.features.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-slate-300"
                  >
                    <Check className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="/record"
                className="block w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-center font-medium transition"
              >
                {t.pricing.free.cta}
              </a>
            </div>

            {/* ── Plus Tier (Highlighted) ── */}
            <div className="relative rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-b from-emerald-500/[0.07] to-slate-800/60 p-8 flex flex-col md:scale-[1.03] shadow-xl shadow-emerald-500/10">
              {/* Popular Badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg shadow-emerald-500/30">
                  <Sparkles className="w-3 h-3" />
                  {t.pricing.plus.badge}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-3 mt-2">
                <h3 className="text-2xl font-bold">{t.pricing.plus.name}</h3>
              </div>
              <div className="mb-1">
                <span className="text-4xl font-bold">
                  {billingPeriod === "monthly"
                    ? t.pricing.plus.price
                    : t.pricing.plus.priceYearly}
                </span>
                <span className="text-sm text-slate-500 ml-1">
                  {billingPeriod === "monthly"
                    ? t.pricing.perMonth
                    : t.pricing.perYear}
                </span>
              </div>
              {t.pricing.plus.cny && (
                <p className="text-xs text-slate-500 mb-1">
                  {billingPeriod === "monthly"
                    ? t.pricing.plus.cny
                    : t.pricing.plus.cnyYearly}
                </p>
              )}
              <p className="text-sm text-slate-400 mb-6">
                {t.pricing.plus.desc}
              </p>
              <ul className="space-y-3 mb-8 flex-grow">
                {t.pricing.plus.features.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-slate-300"
                  >
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() =>
                  handleCheckout(
                    billingPeriod === "monthly"
                      ? "plus_monthly"
                      : "plus_yearly"
                  )
                }
                disabled={!!checkoutLoading}
                className="block w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-white rounded-xl text-center font-semibold transition shadow-lg shadow-emerald-500/20"
              >
                {checkoutLoading?.startsWith("plus") ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {locale === "zh" ? "跳转中..." : "Redirecting..."}
                  </span>
                ) : (
                  t.pricing.plus.cta
                )}
              </button>
            </div>

            {/* ── Pro Tier ── */}
            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/[0.05] to-slate-800/60 p-8 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-2xl font-bold">{t.pricing.pro.name}</h3>
                <span className="px-2.5 py-0.5 bg-amber-500/15 text-amber-300 text-[10px] rounded-full font-semibold uppercase tracking-wider">
                  <Crown className="w-3 h-3 inline mr-1" />
                  {t.pricing.pro.badge}
                </span>
              </div>
              <div className="mb-1">
                <span className="text-4xl font-bold">
                  {billingPeriod === "monthly"
                    ? t.pricing.pro.price
                    : t.pricing.pro.priceYearly}
                </span>
                <span className="text-sm text-slate-500 ml-1">
                  {billingPeriod === "monthly"
                    ? t.pricing.perMonth
                    : t.pricing.perYear}
                </span>
              </div>
              {t.pricing.pro.cny && (
                <p className="text-xs text-slate-500 mb-1">
                  {billingPeriod === "monthly"
                    ? t.pricing.pro.cny
                    : t.pricing.pro.cnyYearly}
                </p>
              )}
              <p className="text-sm text-slate-400 mb-6">
                {t.pricing.pro.desc}
              </p>
              <ul className="space-y-3 mb-8 flex-grow">
                {t.pricing.pro.features.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-slate-300"
                  >
                    <Check className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() =>
                  handleCheckout(
                    billingPeriod === "monthly" ? "pro_monthly" : "pro_yearly"
                  )
                }
                disabled={!!checkoutLoading}
                className="block w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-900 rounded-xl text-center font-semibold transition"
              >
                {checkoutLoading?.startsWith("pro") ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {locale === "zh" ? "跳转中..." : "Redirecting..."}
                  </span>
                ) : (
                  t.pricing.pro.cta
                )}
              </button>
            </div>
          </div>

          {/* ── Feature Comparison Table ── */}
          <div className="mt-16 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-center mb-8">
              {t.pricing.compare.title}
            </h3>
            <div className="rounded-xl border border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800/80">
                    <th className="text-left px-5 py-3 font-semibold text-slate-300">
                      {locale === "zh" ? "功能" : "Feature"}
                    </th>
                    <th className="text-center px-4 py-3 font-semibold text-blue-300 w-24">
                      Free
                    </th>
                    <th className="text-center px-4 py-3 font-semibold text-emerald-300 w-24">
                      Plus
                    </th>
                    <th className="text-center px-4 py-3 font-semibold text-amber-300 w-24">
                      Pro
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {t.pricing.compare.features.map((row, i) => (
                    <tr
                      key={i}
                      className={
                        i % 2 === 0 ? "bg-slate-800/30" : "bg-slate-800/10"
                      }
                    >
                      <td className="px-5 py-3 text-slate-300">{row.label}</td>
                      {(["free", "plus", "pro"] as const).map((tier) => (
                        <td
                          key={tier}
                          className="text-center px-4 py-3 text-slate-400"
                        >
                          {renderCellValue(row[tier])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BUILT FOR ===== */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          {t.builtFor.title}
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          {t.builtFor.subtitle}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {t.builtFor.tags.map((tag) => (
            <span
              key={tag}
              className="px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-sm text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="border-t border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {t.cta.title}
          </h2>
          <p className="text-lg text-slate-400 mb-10">{t.cta.subtitle}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/record"
              className="btn-shimmer px-10 py-4 rounded-xl text-white font-semibold text-lg flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              {t.cta.button}
              <ChevronRight className="w-5 h-5" />
            </a>
          </div>
          <p className="mt-4 text-xs text-slate-600">{t.cta.trustLine}</p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-slate-800 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-white">
              {t.footer.brand}
            </span>
            <span className="text-xs text-slate-500">{t.footer.byline}</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a href="/record" className="hover:text-slate-300 transition">
              {t.footer.app}
            </a>
            <a href="/download" className="hover:text-slate-300 transition">
              {t.footer.download}
            </a>
            <a
              href="https://github.com/Peter-awe"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition"
            >
              GitHub
            </a>
          </div>
          <p className="text-xs text-slate-600">{t.footer.copyright}</p>
        </div>
      </footer>
    </div>
  );
}

// ── Helper for comparison table cells ──

function renderCellValue(value: boolean | string) {
  if (value === true)
    return <Check className="w-4 h-4 text-green-400 mx-auto" />;
  if (value === false)
    return <X className="w-4 h-4 text-slate-600 mx-auto" />;
  return <span className="text-slate-300 font-medium">{value}</span>;
}

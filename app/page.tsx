"use client";

import {
  Mic,
  Languages,
  Brain,
  FileText,
  Download,
  Globe,
  Zap,
  Shield,
  ChevronRight,
  Check,
  Monitor,
  Smartphone,
  Chrome,
  Apple,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="hero-glow top-[-200px] left-1/2 -translate-x-1/2" />

        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center relative z-10">
          {/* Badge */}
          <div className="fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs text-blue-300 font-medium">
              100% Free &mdash; No credit card, no trial limits
            </span>
          </div>

          {/* Headline */}
          <h1 className="fade-up-delay-1 text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            Understand every meeting
            <br />
            <span className="gradient-text">in every language</span>
          </h1>

          {/* Subheadline */}
          <p className="fade-up-delay-2 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Real-time transcription, instant translation, and AI-powered analysis.
            Built for international students and researchers who think across languages.
          </p>

          {/* CTA Buttons */}
          <div className="fade-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/record"
              className="btn-shimmer px-8 py-4 rounded-xl text-white font-semibold text-lg flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-shadow"
            >
              <Chrome className="w-5 h-5" />
              Try Free in Browser
              <ChevronRight className="w-4 h-4" />
            </a>
            <a
              href="/download"
              className="px-8 py-4 rounded-xl bg-slate-800 border border-slate-600 text-white font-semibold text-lg flex items-center gap-2 hover:bg-slate-700 transition"
            >
              <Apple className="w-5 h-5" />
              Download for macOS
            </a>
          </div>

          {/* Trust line */}
          <p className="mt-6 text-xs text-slate-500">
            No sign-up required. Your data stays in your browser.
          </p>
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
            <span className="ml-3 text-xs text-slate-500">KiwiPenNotes &mdash; Recording Session</span>
          </div>

          {/* Mock three-panel layout */}
          <div className="grid grid-cols-3 h-64 md:h-80">
            {/* Transcript panel */}
            <div className="col-span-2 border-r border-slate-700 p-4 space-y-3 overflow-hidden">
              <div className="flex border-b border-slate-700/50 pb-2 mb-2">
                <span className="flex-1 text-xs text-slate-500 uppercase tracking-wider">Transcript</span>
                <span className="flex-1 text-xs text-slate-500 uppercase tracking-wider">Translation</span>
              </div>
              {[
                { en: "Let's discuss the experiment results from last week.", zh: "\u8BA9\u6211\u4EEC\u8BA8\u8BBA\u4E0A\u5468\u7684\u5B9E\u9A8C\u7ED3\u679C\u3002" },
                { en: "The control group showed a 15% improvement.", zh: "\u5BF9\u7167\u7EC4\u663E\u793A\u4E8615%\u7684\u6539\u5584\u3002" },
                { en: "We should adjust the sample size for phase two.", zh: "\u6211\u4EEC\u5E94\u8BE5\u8C03\u6574\u7B2C\u4E8C\u9636\u6BB5\u7684\u6837\u672C\u91CF\u3002" },
              ].map((row, i) => (
                <div key={i} className="flex gap-4 segment-enter" style={{ animationDelay: `${i * 0.3 + 0.5}s`, opacity: 0, animationFillMode: "forwards" }}>
                  <p className="flex-1 text-sm text-slate-300">{row.en}</p>
                  <p className="flex-1 text-sm text-emerald-300">{row.zh}</p>
                </div>
              ))}
              {/* Interim text */}
              <div className="flex gap-4 opacity-50">
                <p className="flex-1 text-sm text-slate-500 italic">Statistical significance was...</p>
                <p className="flex-1 text-sm text-slate-600">...</p>
              </div>
            </div>

            {/* Analysis panel */}
            <div className="p-4 space-y-3 overflow-hidden">
              <div className="text-xs text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-700/50">
                AI Analysis
              </div>
              <div className="bg-slate-700/40 rounded-lg p-3 border border-slate-600/30 text-xs text-slate-300 leading-relaxed">
                <p className="font-medium text-blue-300 mb-1">Key Insights:</p>
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
            Everything you need. Nothing you have to pay for.
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Professional-grade meeting tools, completely free. No hidden fees, no usage limits on core features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="feature-card">
            <Mic className="w-10 h-10 text-blue-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Real-time Transcription</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Instant speech-to-text powered by your browser&apos;s built-in engine.
              Works offline, zero latency, completely free.
            </p>
          </div>

          <div className="feature-card">
            <Languages className="w-10 h-10 text-emerald-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Live Translation</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              10 languages supported. See translations appear alongside the original text
              in real-time as people speak.
            </p>
          </div>

          <div className="feature-card">
            <Brain className="w-10 h-10 text-purple-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">AI Context Analysis</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              AI identifies key topics, action items, and decisions during your meeting.
              Like having a smart assistant taking notes.
            </p>
          </div>

          <div className="feature-card">
            <FileText className="w-10 h-10 text-amber-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Meeting Summary</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              When the meeting ends, get a structured summary with key points,
              action items, innovations, and open questions.
            </p>
          </div>

          <div className="feature-card">
            <Globe className="w-10 h-10 text-cyan-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">10 Languages</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              English, Chinese, Japanese, Korean, French, German, Spanish,
              Portuguese, Russian, and Arabic.
            </p>
          </div>

          <div className="feature-card">
            <Shield className="w-10 h-10 text-green-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Privacy First</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              All data stays in your browser. No account needed.
              Your recordings are stored locally &mdash; we never see them.
            </p>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="border-y border-slate-800 bg-slate-800/20 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Start in 30 seconds
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Open & Record",
                desc: "Click \"Start Recording\" and allow microphone access. That's it. No sign-up, no download needed for the web version.",
              },
              {
                step: "2",
                title: "Watch the magic",
                desc: "See your speech transcribed instantly on the left, with translations appearing on the right. AI analysis runs in the sidebar.",
              },
              {
                step: "3",
                title: "Get your summary",
                desc: "Stop recording and scroll down for a full meeting summary with key points, action items, and innovations.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold text-blue-400">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PLATFORMS ===== */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Available everywhere
        </h2>
        <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">
          Use the free web version in any browser, or download the native macOS app for system audio capture.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Web */}
          <div className="feature-card text-center">
            <Chrome className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">Web</h3>
            <p className="text-xs text-green-400 font-medium mb-3">Available now</p>
            <p className="text-sm text-slate-400 mb-4">
              Works in Chrome &amp; Edge. No download needed.
            </p>
            <a
              href="/record"
              className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300"
            >
              Open App <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* macOS */}
          <div className="feature-card text-center border-blue-500/30">
            <Monitor className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">macOS</h3>
            <p className="text-xs text-amber-400 font-medium mb-3">Coming Q2 2026</p>
            <p className="text-sm text-slate-400 mb-4">
              Native app. Record Zoom, Teams &amp; system audio.
            </p>
            <a
              href="/download"
              className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-300"
            >
              <Download className="w-3.5 h-3.5" /> Get notified
            </a>
          </div>

          {/* iOS */}
          <div className="feature-card text-center">
            <Smartphone className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">iOS</h3>
            <p className="text-xs text-slate-500 font-medium mb-3">Coming Q4 2026</p>
            <p className="text-sm text-slate-400 mb-4">
              Native iPhone app for on-the-go meetings.
            </p>
            <span className="text-sm text-slate-600">
              Stay tuned
            </span>
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="border-y border-slate-800 bg-slate-800/20 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Free. Really.
          </h2>
          <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">
            The core experience is completely free with no limits.
            Premium features are optional for power users.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free tier */}
            <div className="rounded-xl border-2 border-blue-500/50 bg-slate-800/80 p-8">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-2xl font-bold">Free</h3>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full font-medium">
                  Current
                </span>
              </div>
              <p className="text-3xl font-bold mb-1">$0 <span className="text-sm font-normal text-slate-500">forever</span></p>
              <p className="text-sm text-slate-400 mb-6">
                Everything you need for most meetings
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited real-time transcription",
                  "Live translation (10 languages)",
                  "AI context analysis",
                  "Post-meeting structured summary",
                  "Recording library with export",
                  "No account required",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="/record"
                className="block w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-center font-medium transition"
              >
                Start Free
              </a>
            </div>

            {/* Pro tier */}
            <div className="rounded-xl border border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-slate-800/40 p-8">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-2xl font-bold">Pro</h3>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs rounded-full font-medium">
                  Popular
                </span>
              </div>
              <p className="text-3xl font-bold mb-1">$9.99 <span className="text-sm font-normal text-slate-500">/month</span></p>
              <p className="text-xs text-slate-500 mb-1">or $99.99/year (save 17%)</p>
              <p className="text-sm text-slate-400 mb-6">
                For researchers and professionals
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Everything in Free",
                  "AI-enhanced transcript (10hr/mo)",
                  "High-quality LLM translation",
                  "Advanced AI analysis with context",
                  "Knowledge base (upload papers)",
                  "No API key needed — we provide everything",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="/signup"
                className="block w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg text-center font-semibold transition"
              >
                Get Pro
              </a>
              <p className="mt-3 text-center text-xs text-slate-500">
                Also available: $0.99/hr pay-as-you-go
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BUILT FOR ===== */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Built for students who think across borders
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Whether it&apos;s a lab meeting in English, a supervisor call in French,
          or a study group mixing languages &mdash; KiwiPenNotes captures everything and
          makes it searchable, translatable, and actionable.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {[
            "Lab Meetings",
            "Thesis Defenses",
            "Supervisor Calls",
            "Conferences",
            "Study Groups",
            "Lectures",
            "Research Interviews",
          ].map((tag) => (
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
            Stop missing what matters
          </h2>
          <p className="text-lg text-slate-400 mb-10">
            Your next meeting is already complicated enough.
            Let KiwiPenNotes handle the rest.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/record"
              className="btn-shimmer px-10 py-4 rounded-xl text-white font-semibold text-lg flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              Try Free Now
              <ChevronRight className="w-5 h-5" />
            </a>
          </div>
          <p className="mt-4 text-xs text-slate-600">
            No sign-up. No credit card. Works in Chrome &amp; Edge.
          </p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-slate-800 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-white">KiwiPenNotes</span>
            <span className="text-xs text-slate-500">by Pansheng Intelligence</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a href="/record" className="hover:text-slate-300 transition">App</a>
            <a href="/download" className="hover:text-slate-300 transition">Download</a>
            <a
              href="https://github.com/Peter-awe"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition"
            >
              GitHub
            </a>
          </div>
          <p className="text-xs text-slate-600">
            &copy; 2026 KiwiPenNotes. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

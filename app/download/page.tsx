"use client";

import {
  Monitor,
  Smartphone,
  Chrome,
  Apple,
  ChevronRight,
  Check,
  ExternalLink,
  Bell,
} from "lucide-react";

const GITHUB_RELEASE_URL = "https://github.com/Peter-awe/KiwiPenNotes/releases/latest";

export default function DownloadPage() {

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Download KiwiPenNotes</h1>
        <p className="text-lg text-slate-400">
          Choose your platform. The web version is always free and ready to use.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {/* Web — Available Now */}
        <div className="rounded-xl border-2 border-blue-500/50 bg-slate-800/80 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
            <Chrome className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold mb-1">Web App</h2>
          <p className="text-green-400 text-sm font-medium mb-4">
            Available Now
          </p>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Works in Chrome &amp; Edge. No download needed.
            All features included for free.
          </p>
          <a
            href="/record"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition w-full justify-center"
          >
            Open Web App
            <ChevronRight className="w-4 h-4" />
          </a>
          <div className="mt-4 space-y-2">
            {["Real-time transcription", "Live translation", "AI analysis", "Meeting summary"].map(
              (f) => (
                <div key={f} className="flex items-center gap-2 text-xs text-slate-400">
                  <Check className="w-3 h-3 text-green-400" />
                  {f}
                </div>
              )
            )}
          </div>
        </div>

        {/* macOS — Coming Soon */}
        <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-700/50 border border-slate-600 flex items-center justify-center mx-auto mb-4">
            <Monitor className="w-8 h-8 text-slate-300" />
          </div>
          <h2 className="text-xl font-semibold mb-1">macOS</h2>
          <p className="text-amber-400 text-sm font-medium mb-4">
            Coming Q2 2026
          </p>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Native app with system audio capture.
            Record Zoom, Teams &amp; any app audio.
          </p>
          <a
            href={GITHUB_RELEASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition w-full justify-center"
          >
            <Apple className="w-4 h-4" />
            Check Releases
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <div className="mt-4 space-y-2">
            {["Everything in Web", "System audio capture", "Offline mode", "Menu bar app"].map(
              (f) => (
                <div key={f} className="flex items-center gap-2 text-xs text-slate-500">
                  <Check className="w-3 h-3 text-slate-600" />
                  {f}
                </div>
              )
            )}
          </div>
        </div>

        {/* iOS — Coming Later */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-slate-500" />
          </div>
          <h2 className="text-xl font-semibold mb-1">iOS</h2>
          <p className="text-slate-500 text-sm font-medium mb-4">
            Coming Q4 2026
          </p>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Native iPhone app for meetings on the go.
            SwiftUI with Apple Speech Framework.
          </p>
          <button
            disabled
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 border border-slate-700 text-slate-500 rounded-lg font-medium w-full justify-center cursor-not-allowed"
          >
            Not Yet Available
          </button>
          <div className="mt-4 space-y-2">
            {["Everything in Web", "Native iOS performance", "Siri integration", "AirPods support"].map(
              (f) => (
                <div key={f} className="flex items-center gap-2 text-xs text-slate-600">
                  <Check className="w-3 h-3 text-slate-700" />
                  {f}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Notify section */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-8 text-center max-w-lg mx-auto">
        <Bell className="w-8 h-8 text-amber-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold mb-2">Get notified when macOS launches</h3>
        <p className="text-sm text-slate-400 mb-4">
          Star the GitHub repo to stay updated on releases.
        </p>
        <a
          href="https://github.com/Peter-awe/KiwiPenNotes"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          Star on GitHub
        </a>
      </div>

      {/* System requirements */}
      <div className="mt-16 text-center">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          System Requirements
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-500 max-w-3xl mx-auto">
          <div>
            <p className="text-slate-300 font-medium mb-1">Web</p>
            <p>Chrome 90+ or Edge 90+</p>
            <p>Microphone access</p>
          </div>
          <div>
            <p className="text-slate-300 font-medium mb-1">macOS</p>
            <p>macOS 13 Ventura or later</p>
            <p>Apple Silicon or Intel</p>
          </div>
          <div>
            <p className="text-slate-300 font-medium mb-1">iOS</p>
            <p>iOS 17 or later</p>
            <p>iPhone 12 or newer</p>
          </div>
        </div>
      </div>
    </div>
  );
}

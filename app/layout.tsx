import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "KiwiPenNotes — Free Real-time Transcription, Translation & AI Analysis",
  description:
    "Understand every meeting in every language. Free real-time transcription, instant translation, and AI-powered analysis for international students and researchers.",
  keywords: [
    "transcription",
    "translation",
    "meeting",
    "AI",
    "free",
    "real-time",
    "speech to text",
    "international students",
  ],
  openGraph: {
    title: "KiwiPenNotes — Free Meeting Transcription & Translation",
    description:
      "Real-time transcription, instant translation, and AI analysis. 100% free, no sign-up needed.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-900 text-slate-100">
        <nav className="h-14 border-b border-slate-700 bg-slate-800/90 backdrop-blur-sm flex items-center px-6 sticky top-0 z-50">
          <Link href="/" className="text-lg font-semibold text-white">
            KiwiPenNotes
          </Link>
          <div className="flex gap-6 ml-8">
            <Link
              href="/#features"
              className="text-sm text-slate-400 hover:text-white transition hidden md:block"
            >
              Features
            </Link>
            <Link
              href="/#pricing"
              className="text-sm text-slate-400 hover:text-white transition hidden md:block"
            >
              Pricing
            </Link>
            <Link
              href="/download"
              className="text-sm text-slate-400 hover:text-white transition hidden md:block"
            >
              Download
            </Link>
            <span className="text-slate-600 hidden md:block">|</span>
            <Link
              href="/record"
              className="text-sm text-slate-400 hover:text-white transition hidden md:block"
            >
              Record
            </Link>
            <Link
              href="/library"
              className="text-sm text-slate-400 hover:text-white transition hidden md:block"
            >
              Library
            </Link>
            <Link
              href="/settings"
              className="text-sm text-slate-400 hover:text-white transition hidden md:block"
            >
              Settings
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <Link
              href="/record"
              className="text-sm px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition font-medium"
            >
              Open App
            </Link>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}

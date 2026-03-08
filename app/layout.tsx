import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth";
import { LocaleProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import { NavBar } from "@/components/NavBar";
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider>
          <LocaleProvider>
            <AuthProvider>
              <NavBar />
              <main>{children}</main>
            </AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

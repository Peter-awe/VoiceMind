// ============================================================
// /api/welcome-email — Send welcome email to new users via Resend
// Called once when a user first confirms their email
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { verifyAuth } from "@/lib/server-auth";

const FROM_ADDRESS = "KiwiPenNotes <hello@send.kiwipennotes.com>";

// Lazy init to avoid build-time error when env var is not available
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = auth;
  if (!email) {
    return NextResponse.json({ error: "No email found" }, { status: 400 });
  }

  try {
    const { error } = await getResend().emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: "Welcome to KiwiPenNotes — Let's get started",
      html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a; line-height: 1.6;">
  <p style="font-size: 16px;">Hey,</p>

  <p style="font-size: 16px;">My name is Qiwei Pan — I'm the founder of KiwiPenNotes.</p>

  <p style="font-size: 16px;">I built KiwiPenNotes because I wanted a better way to capture and understand spoken content — a simple, fast tool that turns your voice into organized notes in real-time.</p>

  <p style="font-size: 16px; font-weight: 600;">Here are 3 tips to get started:</p>

  <p style="font-size: 16px;"><strong>1. Start your first recording</strong> — Go to the Record page, pick your language, and tap the mic. Your speech will be transcribed in real-time.</p>

  <p style="font-size: 16px;"><strong>2. Try AI analysis</strong> — After recording, use AI to summarize, extract key points, or translate your notes into any language.</p>

  <p style="font-size: 16px;"><strong>3. Set up your API key</strong> — Head to Settings, add your free Gemini API key, and unlock unlimited AI features at no cost.</p>

  <p style="font-size: 16px;">P.S.: What brought you to KiwiPenNotes? What do you plan to use it for?</p>

  <p style="font-size: 16px;">Hit "Reply" and let me know — I read every email.</p>

  <p style="font-size: 16px;">Cheers,<br/>Qiwei Pan<br/><span style="color: #666;">Founder, KiwiPenNotes</span></p>
</div>
      `.trim(),
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: "Failed to send" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Welcome email error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

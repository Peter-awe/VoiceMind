import { NextResponse } from "next/server";

// Deprecated: all Gemini calls now happen client-side
export async function POST() {
  return NextResponse.json(
    { translatedText: "", error: "Please refresh the page (Cmd+Shift+R) to use the latest version." },
    { status: 200 }
  );
}

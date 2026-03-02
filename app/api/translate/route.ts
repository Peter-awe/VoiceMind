import { NextRequest, NextResponse } from "next/server";
import { translateText } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing API key. Please configure your Gemini API key in Settings." },
      { status: 401 }
    );
  }

  try {
    const { text, sourceLang, targetLang } = await req.json();

    if (!text?.trim()) {
      return NextResponse.json(
        { error: "No text provided" },
        { status: 400 }
      );
    }

    const translatedText = await translateText(
      apiKey,
      text,
      sourceLang || "en",
      targetLang || "zh"
    );

    return NextResponse.json({ translatedText });
  } catch (error: unknown) {
    console.error("Translation error:", error);
    const message = error instanceof Error ? error.message : "Translation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

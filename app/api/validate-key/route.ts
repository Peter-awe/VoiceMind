import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json({ valid: false, error: "No key provided" });
  }

  try {
    const valid = await validateApiKey(apiKey);
    return NextResponse.json({ valid });
  } catch (error: unknown) {
    console.error("Key validation error:", error);
    return NextResponse.json({ valid: false, error: "Validation failed" });
  }
}

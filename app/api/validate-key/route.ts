import { NextResponse } from "next/server";

// Deprecated: validation now happens client-side
export async function POST() {
  return NextResponse.json({ valid: true });
}

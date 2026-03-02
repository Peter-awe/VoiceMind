// ============================================================
// POST /api/kb/upload — Upload PDF to knowledge base
// Accepts multipart form with PDF file
// Extracts text and stores in Supabase
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { requirePaid } from "@/lib/server-auth";
import { createClient } from "@supabase/supabase-js";

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

// Simple PDF text extraction (works in edge/worker environments)
// Falls back to reading as text if pdf-parse isn't available
async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  // Simple approach: extract visible text from PDF binary
  // This handles basic PDFs; for complex ones, consider a cloud PDF service
  const bytes = new Uint8Array(buffer);
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);

  // Extract text between BT/ET (text objects) in PDF
  const textParts: string[] = [];
  const tjRegex = /\(([^)]*)\)\s*Tj/g;
  let match;
  while ((match = tjRegex.exec(text)) !== null) {
    if (match[1].trim()) textParts.push(match[1]);
  }

  if (textParts.length > 0) {
    return textParts.join(" ");
  }

  // Fallback: try to extract any readable text
  const readable = text.replace(/[^\x20-\x7E\n\r\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Filter out PDF structure noise
  const lines = readable.split(" ").filter(
    (w) =>
      w.length > 1 &&
      !w.startsWith("/") &&
      !w.match(/^\d+$/) &&
      !w.match(/^[a-f0-9]+$/i)
  );

  return lines.join(" ").substring(0, 50000); // Cap at 50K chars
}

export async function POST(req: NextRequest) {
  const auth = await requirePaid(req);
  if (!auth || auth.tier !== "pro") {
    return NextResponse.json(
      { error: "Knowledge base requires Pro subscription" },
      { status: 403 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 10MB)" },
        { status: 400 }
      );
    }

    // Check document count (max 20 per user)
    const supabase = getAdminSupabase();
    const { count } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", auth.userId);

    if ((count || 0) >= 20) {
      return NextResponse.json(
        { error: "Document limit reached (max 20). Delete some to upload more." },
        { status: 400 }
      );
    }

    // Extract text
    const buffer = await file.arrayBuffer();
    let content: string;

    if (file.name.endsWith(".pdf")) {
      content = await extractTextFromPDF(buffer);
    } else if (
      file.name.endsWith(".txt") ||
      file.name.endsWith(".md") ||
      file.name.endsWith(".csv")
    ) {
      content = new TextDecoder().decode(buffer);
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Use PDF, TXT, MD, or CSV." },
        { status: 400 }
      );
    }

    if (!content || content.length < 10) {
      return NextResponse.json(
        { error: "Could not extract text from file" },
        { status: 400 }
      );
    }

    // Cap content length
    content = content.substring(0, 100000);

    // Store in database
    const { data, error } = await supabase
      .from("documents")
      .insert({
        user_id: auth.userId,
        filename: file.name,
        content,
      })
      .select("id, filename, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({
      document: data,
      content_length: content.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("KB upload error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { FileText, Upload, Trash2, BookOpen, X } from "lucide-react";

interface Document {
  id: string;
  filename: string;
  created_at: string;
}

interface KnowledgeBaseProps {
  onContextChange?: (context: string) => void;
}

export function KnowledgeBase({ onContextChange }: KnowledgeBaseProps) {
  const { session, isPro } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);

  const token = session?.access_token;

  const loadDocuments = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/kb/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch {
      // ignore
    }
  }, [token]);

  useEffect(() => {
    if (isPro && token) loadDocuments();
  }, [isPro, token, loadDocuments]);

  // Notify parent of knowledge context (document names for prompt)
  useEffect(() => {
    if (documents.length > 0) {
      onContextChange?.(
        `User has ${documents.length} reference document(s): ${documents
          .map((d) => d.filename)
          .join(", ")}`
      );
    } else {
      onContextChange?.("");
    }
  }, [documents, onContextChange]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/kb/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
      } else {
        await loadDocuments();
      }
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = "";
    }
  };

  const handleDelete = async (docId: string) => {
    if (!token) return;
    try {
      await fetch("/api/kb/delete", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ documentId: docId }),
      });
      await loadDocuments();
    } catch {
      // ignore
    }
  };

  if (!isPro) return null;

  return (
    <div className="border border-slate-700 rounded-lg bg-slate-800/50">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white transition"
      >
        <BookOpen className="w-4 h-4 text-purple-400" />
        Knowledge Base
        <span className="text-xs text-slate-500 ml-1">
          ({documents.length}/20)
        </span>
        <span className="ml-auto text-xs text-slate-500">
          {expanded ? "Hide" : "Show"}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-slate-700 p-3 space-y-3">
          {/* Upload */}
          <label
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-dashed border-slate-600 text-sm text-slate-400 hover:text-white hover:border-blue-500 transition cursor-pointer ${
              uploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Upload className="w-4 h-4" />
            {uploading ? "Uploading..." : "Upload PDF, TXT, or MD"}
            <input
              type="file"
              accept=".pdf,.txt,.md,.csv"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 rounded px-2 py-1">
              <X className="w-3 h-3 shrink-0" />
              {error}
            </div>
          )}

          {/* Document list */}
          {documents.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-2">
              No documents yet. Upload papers for AI context.
            </p>
          ) : (
            <div className="space-y-1">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-700/50 group"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-xs text-slate-300 truncate flex-1">
                    {doc.filename}
                  </span>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  FolderOpen,
  Search,
  Trash2,
  Download,
  Clock,
  FileText,
} from "lucide-react";
import {
  listRecordings,
  deleteRecording,
  exportRecording,
  Recording,
} from "@/lib/storage";

export default function LibraryPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setRecordings(listRecordings());
  }, []);

  const filtered = recordings.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.rows.some((row) => row.text.toLowerCase().includes(q))
    );
  });

  const selected = recordings.find((r) => r.id === selectedId) || null;

  const handleDelete = (id: string) => {
    if (!confirm("Delete this recording? This cannot be undone.")) return;
    deleteRecording(id);
    setRecordings(listRecordings());
    if (selectedId === id) setSelectedId(null);
  };

  const handleExport = (id: string, format: "md" | "txt") => {
    const content = exportRecording(id, format);
    if (!content) return;

    const rec = recordings.find((r) => r.id === id);
    const filename = `${rec?.title || "recording"}.${format}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex">
      {/* Left: List */}
      <div className="w-80 border-r border-slate-700 flex flex-col bg-slate-800/30">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen className="w-5 h-5 text-green-400" />
            <h2 className="text-sm font-semibold text-slate-200">
              Recording Library
            </h2>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recordings..."
              className="w-full pl-9 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-slate-500 text-sm italic">
              {recordings.length === 0
                ? "No recordings yet. Start recording to see them here."
                : "No matches found."}
            </div>
          )}

          {filtered.map((rec) => (
            <button
              key={rec.id}
              onClick={() => setSelectedId(rec.id)}
              className={`w-full text-left px-4 py-3 border-b border-slate-700/30 hover:bg-slate-700/30 transition ${
                selectedId === rec.id ? "bg-slate-700/50" : ""
              }`}
            >
              <div className="text-sm text-slate-200 font-medium truncate">
                {rec.title}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(rec.date).toLocaleDateString()}
                </span>
                <span>{formatDuration(rec.duration)}</span>
                <span>{rec.rows.length} segments</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Detail */}
      <div className="flex-1 flex flex-col">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a recording to view details</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-200">
                  {selected.title}
                </h2>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span>{new Date(selected.date).toLocaleString()}</span>
                  <span>
                    {selected.sourceLang} → {selected.targetLang}
                  </span>
                  <span>{formatDuration(selected.duration)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExport(selected.id, "md")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export MD
                </button>
                <button
                  onClick={() => handleExport(selected.id, "txt")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export TXT
                </button>
                <button
                  onClick={() => handleDelete(selected.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selected.rows.map((row, i) => (
                <div
                  key={i}
                  className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30"
                >
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs text-slate-500 font-mono">
                      {formatDuration(row.startTime)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200">{row.text}</p>
                  {row.translation && (
                    <p className="text-sm text-emerald-300 mt-1">
                      {row.translation}
                    </p>
                  )}
                </div>
              ))}

              {selected.summary && (
                <div className="mt-6 pt-6 border-t border-slate-700">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">
                    Meeting Summary
                  </h3>
                  <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
                    <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {selected.summary}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

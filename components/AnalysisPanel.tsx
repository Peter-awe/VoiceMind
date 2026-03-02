"use client";

import { useEffect, useRef } from "react";

export interface AnalysisEntry {
  content: string;
  timestamp: number;
}

interface Props {
  analyses: AnalysisEntry[];
  streamingText: string;
  isPaused: boolean;
  onTogglePause: () => void;
}

export default function AnalysisPanel({
  analyses,
  streamingText,
  isPaused,
  onTogglePause,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [analyses, streamingText]);

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <h2 className="text-sm font-semibold text-slate-300">
          AI Context Analysis
        </h2>
        <button
          onClick={onTogglePause}
          className={`text-xs px-2 py-1 rounded transition ${
            isPaused
              ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
              : "bg-slate-700 text-slate-400 hover:bg-slate-600"
          }`}
        >
          {isPaused ? "Paused" : "Active"}
        </button>
      </div>

      <div className="panel-body flex-1 space-y-4">
        {analyses.length === 0 && !streamingText && (
          <p className="text-slate-500 text-sm italic">
            AI analysis will appear here during recording...
          </p>
        )}

        {analyses.map((a, i) => (
          <div
            key={i}
            className="segment-enter bg-slate-700/50 rounded-lg p-3 border border-slate-600/50"
          >
            <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
              {a.content}
            </div>
          </div>
        ))}

        {/* Streaming analysis text */}
        {streamingText && (
          <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/30">
            <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap streaming-cursor">
              {streamingText}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

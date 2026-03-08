"use client";

import { useEffect, useRef } from "react";
import { Loader2, Play } from "lucide-react";

export interface AnalysisEntry {
  content: string;
  timestamp: number;
}

interface Props {
  analyses: AnalysisEntry[];
  streamingText: string;
  isAnalyzing: boolean;
  onAnalyze: () => void;
}

export default function AnalysisPanel({
  analyses,
  streamingText,
  isAnalyzing,
  onAnalyze,
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
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className={`text-xs px-3 py-1 rounded transition flex items-center gap-1.5 ${
            isAnalyzing
              ? "bg-blue-500/20 text-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-500 text-white"
          }`}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              <Play className="w-3 h-3" />
              Analyze
            </>
          )}
        </button>
      </div>

      <div className="panel-body flex-1 space-y-4">
        {analyses.length === 0 && !streamingText && (
          <p className="text-slate-500 text-sm italic">
            Click &quot;Analyze&quot; to get AI insights on the conversation.
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

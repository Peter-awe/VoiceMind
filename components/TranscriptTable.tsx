"use client";

import { useEffect, useRef } from "react";
import { formatTime } from "@/lib/speech";

export interface TableRow {
  text: string;
  translation?: string;
  startTime: number; // seconds since recording start
}

interface Props {
  rows: TableRow[];
  interimText: string;
  targetLanguage: string;
}

const LANGUAGE_NAMES: Record<string, string> = {
  zh: "Chinese",
  en: "English",
  ja: "Japanese",
  ko: "Korean",
  fr: "French",
  de: "German",
  es: "Spanish",
  pt: "Portuguese",
  ru: "Russian",
  ar: "Arabic",
};

export default function TranscriptTable({
  rows,
  interimText,
  targetLanguage,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [rows, interimText]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex border-b border-slate-700 bg-slate-800/80 shrink-0">
        <div className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Transcript
        </div>
        <div className="w-px bg-slate-700" />
        <div className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {LANGUAGE_NAMES[targetLanguage] || targetLanguage} Translation
        </div>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {rows.length === 0 && !interimText && (
          <div className="px-4 py-8 text-center text-slate-500 text-sm italic">
            Waiting for audio...
          </div>
        )}

        {rows.map((row, i) => (
          <div
            key={i}
            className="flex border-b border-slate-700/30 segment-enter"
          >
            {/* Original text */}
            <div className="flex-1 px-4 py-2.5 min-h-[2.5rem]">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="text-xs text-slate-500 font-mono">
                  {formatTime(row.startTime)}
                </span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                {row.text}
              </p>
            </div>

            {/* Divider */}
            <div className="w-px bg-slate-700/50" />

            {/* Translation */}
            <div className="flex-1 px-4 py-2.5 min-h-[2.5rem]">
              {row.translation ? (
                <p className="text-sm text-emerald-300 leading-relaxed pt-4">
                  {row.translation}
                </p>
              ) : (
                <p className="text-sm text-slate-600 italic pt-4">...</p>
              )}
            </div>
          </div>
        ))}

        {/* Interim text row */}
        {interimText && (
          <div className="flex border-b border-slate-700/30 opacity-60">
            <div className="flex-1 px-4 py-2.5">
              <p className="text-sm text-slate-400 leading-relaxed italic">
                {interimText}
              </p>
            </div>
            <div className="w-px bg-slate-700/50" />
            <div className="flex-1 px-4 py-2.5" />
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

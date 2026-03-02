"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Settings2, Loader2 } from "lucide-react";
import ApiKeyGuard from "@/components/ApiKeyGuard";
import AudioRecorder from "@/components/AudioRecorder";
import TranscriptTable, { TableRow } from "@/components/TranscriptTable";
import AnalysisPanel, { AnalysisEntry } from "@/components/AnalysisPanel";
import { SpeechResult } from "@/lib/speech";
import { getApiKey, getSettings, saveRecording } from "@/lib/storage";
import { translateText, streamAnalysis, streamSummary } from "@/lib/gemini-client";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "es", name: "Spanish" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ar", name: "Arabic" },
];

// Translation buffer config
const TRANSLATION_CHAR_THRESHOLD = 120;
const TRANSLATION_SILENCE_MS = 5000;

export default function RecordPage() {
  return (
    <ApiKeyGuard>
      <RecordPageInner />
    </ApiKeyGuard>
  );
}

function RecordPageInner() {
  // Load settings
  const settings = getSettings();

  // Session config
  const [sourceLang, setSourceLang] = useState(settings.sourceLang);
  const [targetLang, setTargetLang] = useState(settings.targetLang);

  // Recording state
  const [recordingStatus, setRecordingStatus] = useState<
    "idle" | "recording" | "paused"
  >("idle");

  // View mode
  const [viewMode, setViewMode] = useState<"recording" | "post-meeting">(
    "recording"
  );

  // Transcript rows
  const [tableRows, setTableRows] = useState<TableRow[]>([]);
  const [interimText, setInterimText] = useState("");

  // Translation buffer
  const translationBufferRef = useRef<string>("");
  const translationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentRowIndexRef = useRef<number>(-1);

  // Analysis
  const [analyses, setAnalyses] = useState<AnalysisEntry[]>([]);
  const [streamingAnalysis, setStreamingAnalysis] = useState("");
  const [analysisPaused, setAnalysisPaused] = useState(false);
  const analysisTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnalysisTimeRef = useRef<number>(0);
  const accumulatedTextRef = useRef<string>("");

  // Post-meeting summary
  const [meetingSummary, setMeetingSummary] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  // Config panel
  const [showConfig, setShowConfig] = useState(false);

  // Elapsed time
  const elapsedRef = useRef(0);

  // ----------- Translation Logic -----------

  const flushTranslation = useCallback(
    async (text: string, rowIndex: number) => {
      if (!text.trim()) return;

      const apiKey = getApiKey();
      if (!apiKey) return;

      try {
        const translatedText = await translateText(apiKey, text, sourceLang, targetLang);
        if (translatedText) {
          setTableRows((prev) => {
            const rows = [...prev];
            if (rows[rowIndex]) {
              rows[rowIndex] = {
                ...rows[rowIndex],
                translation: translatedText,
              };
            }
            return rows;
          });
        }
      } catch (err) {
        console.error("Translation error:", err);
      }
    },
    [sourceLang, targetLang]
  );

  const scheduleTranslation = useCallback(() => {
    if (translationTimerRef.current) {
      clearTimeout(translationTimerRef.current);
    }
    translationTimerRef.current = setTimeout(() => {
      const text = translationBufferRef.current;
      const idx = currentRowIndexRef.current;
      if (text.trim() && idx >= 0) {
        flushTranslation(text, idx);
        translationBufferRef.current = "";
      }
    }, TRANSLATION_SILENCE_MS);
  }, [flushTranslation]);

  // ----------- Analysis Logic -----------

  const triggerAnalysis = useCallback(async () => {
    const text = accumulatedTextRef.current;
    if (!text.trim() || text.length < 50) return;
    if (analysisPaused) return;

    const apiKey = getApiKey();
    if (!apiKey) return;

    lastAnalysisTimeRef.current = Date.now();
    setStreamingAnalysis("");

    await streamAnalysis(
      apiKey,
      text,
      targetLang,
      (fullText) => setStreamingAnalysis(fullText),
      (fullText) => {
        if (fullText) {
          setAnalyses((prev) => [
            ...prev,
            { content: fullText, timestamp: Date.now() },
          ]);
          setStreamingAnalysis("");
          accumulatedTextRef.current = "";
        }
      },
      (err) => {
        console.error("Analysis error:", err);
        setStreamingAnalysis("");
      }
    );
  }, [targetLang, analysisPaused]);

  // Start/stop analysis timer with recording
  useEffect(() => {
    if (recordingStatus === "recording" && !analysisPaused) {
      const interval = (getSettings().analysisInterval || 30) * 1000;
      analysisTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - lastAnalysisTimeRef.current;
        if (elapsed >= interval) {
          triggerAnalysis();
        }
      }, 5000); // Check every 5 seconds
    } else {
      if (analysisTimerRef.current) {
        clearInterval(analysisTimerRef.current);
        analysisTimerRef.current = null;
      }
    }

    return () => {
      if (analysisTimerRef.current) {
        clearInterval(analysisTimerRef.current);
      }
    };
  }, [recordingStatus, analysisPaused, triggerAnalysis]);

  // ----------- Speech Result Handler -----------

  const handleSpeechResult = useCallback(
    (result: SpeechResult) => {
      if (result.isFinal) {
        // Add as a new row
        setTableRows((prev) => {
          const newRow: TableRow = {
            text: result.text,
            startTime: elapsedRef.current,
          };
          const newRows = [...prev, newRow];
          currentRowIndexRef.current = newRows.length - 1;
          return newRows;
        });

        // Buffer for translation
        translationBufferRef.current += " " + result.text;
        accumulatedTextRef.current += " " + result.text;

        // Check if buffer is large enough
        if (translationBufferRef.current.length >= TRANSLATION_CHAR_THRESHOLD) {
          const text = translationBufferRef.current;
          const idx = currentRowIndexRef.current;
          translationBufferRef.current = "";
          if (translationTimerRef.current) {
            clearTimeout(translationTimerRef.current);
          }
          // Use setTimeout to let state settle
          setTimeout(() => flushTranslation(text.trim(), idx), 50);
        } else {
          scheduleTranslation();
        }

        setInterimText("");
      } else {
        setInterimText(result.text);
      }
    },
    [flushTranslation, scheduleTranslation]
  );

  // ----------- Status Change Handler -----------

  const handleStatusChange = useCallback(
    (status: "idle" | "recording" | "paused") => {
      const wasActive =
        recordingStatus === "recording" || recordingStatus === "paused";

      if (wasActive && status === "idle" && tableRows.length > 0) {
        // Flush remaining translation buffer
        const remainingText = translationBufferRef.current.trim();
        if (remainingText) {
          flushTranslation(remainingText, currentRowIndexRef.current);
          translationBufferRef.current = "";
        }

        // Save recording to localStorage
        saveRecording({
          title: `Recording ${new Date().toLocaleString()}`,
          sourceLang,
          targetLang,
          duration: elapsedRef.current,
          rows: tableRows.map((r) => ({
            text: r.text,
            translation: r.translation,
            startTime: r.startTime,
          })),
          analyses: analyses.map((a) => a.content),
        });

        // Switch to post-meeting view
        setViewMode("post-meeting");
      }
      setRecordingStatus(status);
    },
    [recordingStatus, tableRows, sourceLang, targetLang, analyses, flushTranslation]
  );

  // Track elapsed time
  useEffect(() => {
    if (recordingStatus === "recording") {
      const timer = setInterval(() => {
        elapsedRef.current += 1;
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [recordingStatus]);

  // ----------- Post-meeting Summary -----------

  useEffect(() => {
    if (viewMode !== "post-meeting" || tableRows.length === 0) return;

    const fullTranscript = tableRows.map((r) => r.text).join(" ");
    if (!fullTranscript.trim()) return;

    const apiKey = getApiKey();
    if (!apiKey) return;

    setIsSummarizing(true);
    setMeetingSummary("");

    let cancelled = false;

    streamSummary(
      apiKey,
      fullTranscript,
      targetLang,
      (token) => {
        if (!cancelled) {
          setMeetingSummary((prev) => prev + token);
        }
      },
      () => {
        if (!cancelled) setIsSummarizing(false);
      },
      (err) => {
        console.error("Summary error:", err);
        if (!cancelled) setIsSummarizing(false);
      }
    );

    setTimeout(() => {
      summaryRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 600);

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  // ----------- New Recording -----------

  const handleNewRecording = useCallback(() => {
    setViewMode("recording");
    setTableRows([]);
    setInterimText("");
    setAnalyses([]);
    setStreamingAnalysis("");
    setMeetingSummary("");
    setIsSummarizing(false);
    elapsedRef.current = 0;
    translationBufferRef.current = "";
    currentRowIndexRef.current = -1;
    accumulatedTextRef.current = "";
    lastAnalysisTimeRef.current = 0;
  }, []);

  // ===== POST-MEETING VIEW =====
  if (viewMode === "post-meeting") {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex flex-col">
        {/* Top bar */}
        <div className="h-14 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-300">
              Meeting Complete
            </span>
            <span className="text-xs text-slate-500">
              {tableRows.length} segments |{" "}
              {tableRows.filter((r) => r.translation).length} translations |{" "}
              {analyses.length} analyses
            </span>
          </div>
          <button
            onClick={handleNewRecording}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition text-sm"
          >
            New Recording
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Original grid: TranscriptTable (2/3) + AnalysisPanel (1/3) */}
          <div className="grid grid-cols-3 gap-0 h-[calc(100vh-7rem)] border-b border-slate-600">
            <div className="col-span-2 border-r border-slate-700 overflow-hidden">
              <TranscriptTable
                rows={tableRows}
                interimText=""
                targetLanguage={targetLang}
              />
            </div>
            <div className="overflow-hidden">
              <AnalysisPanel
                analyses={analyses}
                streamingText=""
                isPaused={false}
                onTogglePause={() => {}}
              />
            </div>
          </div>

          {/* Meeting Summary section */}
          <div ref={summaryRef} className="max-w-5xl mx-auto px-6 py-10">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-semibold text-slate-200">
                Meeting Summary
              </h2>
              {isSummarizing && (
                <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
              )}
            </div>

            {!meetingSummary && isSummarizing && (
              <div className="flex items-center gap-3 text-slate-400 py-8">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating comprehensive meeting summary...</span>
              </div>
            )}

            {!meetingSummary && !isSummarizing && (
              <p className="text-slate-500 text-sm italic">
                No summary available.
              </p>
            )}

            {meetingSummary && (
              <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-6">
                <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap summary-content">
                  {meetingSummary}
                </div>
                {isSummarizing && (
                  <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-0.5 align-text-bottom" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===== RECORDING VIEW =====
  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Top bar */}
      <div className="h-14 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between px-4">
        <AudioRecorder
          sourceLang={sourceLang}
          onResult={handleSpeechResult}
          onStatusChange={handleStatusChange}
        />

        <div className="flex items-center gap-4">
          {/* Language selectors */}
          <div className="flex items-center gap-2 text-sm">
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              disabled={recordingStatus !== "idle"}
              className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 disabled:opacity-50"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
            <span className="text-slate-500">-&gt;</span>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 text-slate-400 hover:text-white transition"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Config panel */}
      {showConfig && (
        <div className="border-b border-slate-700 bg-slate-800/30 px-4 py-3">
          <div className="flex flex-wrap gap-4 text-xs text-slate-400">
            <span>ASR: Web Speech API (free)</span>
            <span>|</span>
            <span>LLM: Gemini 2.5 Flash (free tier)</span>
            <span>|</span>
            <span>Analysis interval: {getSettings().analysisInterval}s</span>
          </div>
        </div>
      )}

      {/* Two-panel layout */}
      <div className="flex-1 grid grid-cols-3 gap-0 overflow-hidden">
        <div className="col-span-2 border-r border-slate-700 overflow-hidden">
          <TranscriptTable
            rows={tableRows}
            interimText={interimText}
            targetLanguage={targetLang}
          />
        </div>
        <div className="overflow-hidden">
          <AnalysisPanel
            analyses={analyses}
            streamingText={streamingAnalysis}
            isPaused={analysisPaused}
            onTogglePause={() => setAnalysisPaused(!analysisPaused)}
          />
        </div>
      </div>

      {/* Status bar */}
      <div className="h-8 border-t border-slate-700 bg-slate-800/50 flex items-center px-4 text-xs text-slate-500">
        <span>
          {tableRows.length} segments |{" "}
          {tableRows.filter((r) => r.translation).length} translations |{" "}
          {analyses.length} analyses
        </span>
      </div>
    </div>
  );
}

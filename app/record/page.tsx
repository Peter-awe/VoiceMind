"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Settings2, Loader2, Sparkles, Crown } from "lucide-react";
import ApiKeyGuard from "@/components/ApiKeyGuard";
import AudioRecorder from "@/components/AudioRecorder";
import TranscriptTable, { TableRow } from "@/components/TranscriptTable";
import AnalysisPanel, { AnalysisEntry } from "@/components/AnalysisPanel";
import { KnowledgeBase } from "@/components/KnowledgeBase";
import { SpeechResult } from "@/lib/speech";
import {
  getApiKey,
  getSettings,
  getProvider as getProviderName,
  saveRecording,
  updateRecording,
} from "@/lib/storage";
import { getProvider } from "@/lib/ai-provider";
import type { AIProvider } from "@/lib/ai-provider";
import { useAuth } from "@/lib/auth";

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

// Translation triggers immediately per sentence (no batching)

export default function RecordPage() {
  const { user, isPro, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
      </div>
    );
  }

  // Pro Max users skip API key guard — we provide everything
  if (user && isPro) {
    return <RecordPageInner proMode />;
  }

  // Free users need their own API key
  return (
    <ApiKeyGuard>
      <RecordPageInner proMode={false} />
    </ApiKeyGuard>
  );
}

// =================================================================
// Pro Max server-side LLM helpers (used instead of client-side provider)
// =================================================================

async function proTranslate(
  text: string,
  sourceLang: string,
  targetLang: string,
  token: string
): Promise<string> {
  const res = await fetch("/api/llm/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text, sourceLang, targetLang }),
  });
  if (!res.ok) throw new Error("Translation failed");
  const data = await res.json();
  return data.translation;
}

async function proStreamLLM(
  endpoint: string,
  body: Record<string, unknown>,
  token: string,
  onToken: (text: string) => void,
  onDone: (fullText: string) => void,
  onError: (err: string) => void
) {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok || !res.body) {
      onError(`API error: ${res.status}`);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = ""; // Buffer for incomplete SSE lines across chunks

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // Keep the last (possibly incomplete) line in the buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6);
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullText += content;
            onToken(fullText);
          }
        } catch {
          // skip parse errors
        }
      }
    }

    // Process any remaining data in buffer
    if (buffer.startsWith("data: ")) {
      const data = buffer.slice(6);
      if (data !== "[DONE]") {
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullText += content;
            onToken(fullText);
          }
        } catch {
          // skip
        }
      }
    }

    onDone(fullText);
  } catch (err) {
    onError(err instanceof Error ? err.message : "Stream failed");
  }
}

// =================================================================
// Main record page (works in both free and pro mode)
// =================================================================

function RecordPageInner({ proMode }: { proMode: boolean }) {
  const { session, profile } = useAuth();
  const settings = getSettings();

  // AI Provider ref (for free users)
  const providerRef = useRef<AIProvider | null>(null);
  const providerNameRef = useRef<string>("");

  // Knowledge base context (Pro Max only)
  const [kbContext, setKbContext] = useState("");

  // Row counter for translation (avoids async index issues)
  const rowCountRef = useRef(0);

  // Ref to always access latest tableRows (for manual analysis)
  const tableRowsRef = useRef<TableRow[]>([]);

  // Helper: get client-side provider (free users)
  const getAI = useCallback(async (): Promise<AIProvider | null> => {
    if (proMode) return null; // Pro uses server-side
    const name = getProviderName();
    const key = getApiKey();
    if (!key) return null;

    if (providerRef.current && providerNameRef.current === `${name}:${key}`) {
      return providerRef.current;
    }

    const p = await getProvider(name, key);
    providerRef.current = p;
    providerNameRef.current = `${name}:${key}`;
    return p;
  }, [proMode]);

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

  // Analysis (manual trigger only)
  const [analyses, setAnalyses] = useState<AnalysisEntry[]>([]);
  const [streamingAnalysis, setStreamingAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const analysisInProgressRef = useRef(false);

  // Saved recording ID (to update with summary later)
  const lastRecordingIdRef = useRef<string>("");

  // Post-meeting summary
  const [meetingSummary, setMeetingSummary] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  // Config panel
  const [showConfig, setShowConfig] = useState(false);

  // Elapsed time
  const elapsedRef = useRef(0);

  // Enhanced STT state (Pro Max)
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceMessage, setEnhanceMessage] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Auth token for Pro Max API calls
  const token = session?.access_token || "";

  // ----------- MediaRecorder for Pro Max STT Enhancement -----------

  const startMediaRecorder = useCallback(async () => {
    if (!proMode) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.start(1000); // collect chunks every 1s
      mediaRecorderRef.current = recorder;
    } catch (err) {
      console.warn("MediaRecorder start failed:", err);
    }
  }, [proMode]);

  const stopMediaRecorder = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((t) => t.stop());
      mediaRecorderRef.current = null;
    }
  }, []);

  // ----------- Keep tableRows ref in sync (for manual analysis) -----------

  useEffect(() => {
    tableRowsRef.current = tableRows;
  }, [tableRows]);

  // ----------- Translation Logic (per-sentence, no batching) -----------

  const translateRow = useCallback(
    async (text: string, rowIndex: number) => {
      if (!text.trim()) return;

      try {
        let translatedText: string;

        if (proMode && token) {
          translatedText = await proTranslate(
            text,
            sourceLang,
            targetLang,
            token
          );
        } else {
          const ai = await getAI();
          if (!ai) return;
          translatedText = await ai.translateText(text, sourceLang, targetLang);
        }

        if (translatedText) {
          setTableRows((prev) => {
            const rows = [...prev];
            if (rows[rowIndex]) {
              rows[rowIndex] = { ...rows[rowIndex], translation: translatedText };
            }
            return rows;
          });
        }
      } catch (err) {
        console.error("Translation error:", err);
      }
    },
    [sourceLang, targetLang, proMode, token, getAI]
  );

  // ----------- Analysis Logic (manual trigger only) -----------

  const triggerAnalysis = useCallback(async () => {
    // Gather ALL transcript text from current rows
    const text = tableRowsRef.current.map((r) => r.text).join(" ");
    if (!text.trim() || text.length < 50) return;
    if (analysisInProgressRef.current) return;

    analysisInProgressRef.current = true;
    setIsAnalyzing(true);
    setStreamingAnalysis("");

    const handleDone = (fullText: string) => {
      analysisInProgressRef.current = false;
      setIsAnalyzing(false);
      if (fullText) {
        setAnalyses((prev) => [
          ...prev,
          { content: fullText, timestamp: Date.now() },
        ]);
        setStreamingAnalysis("");
      }
    };

    const handleError = (err: string) => {
      analysisInProgressRef.current = false;
      setIsAnalyzing(false);
      console.error("Analysis error:", err);
      setStreamingAnalysis("");
    };

    if (proMode && token) {
      proStreamLLM(
        "/api/llm/analyze",
        { transcript: text, targetLang, knowledgeContext: kbContext },
        token,
        (fullText) => setStreamingAnalysis(fullText),
        handleDone,
        handleError
      );
    } else {
      const ai = await getAI();
      if (!ai) {
        analysisInProgressRef.current = false;
        setIsAnalyzing(false);
        return;
      }
      ai.streamAnalysis(
        text,
        targetLang,
        (fullText) => setStreamingAnalysis(fullText),
        handleDone,
        handleError
      );
    }
  }, [targetLang, proMode, token, kbContext, getAI]);

  // ----------- Speech Result Handler (translate each sentence immediately) -----------

  const handleSpeechResult = useCallback(
    (result: SpeechResult) => {
      if (result.isFinal) {
        // Capture the row index for this sentence
        const rowIndex = rowCountRef.current;
        rowCountRef.current += 1;

        setTableRows((prev) => [
          ...prev,
          {
            text: result.text,
            startTime: elapsedRef.current,
          },
        ]);

        // Translate this sentence immediately into its own row
        translateRow(result.text, rowIndex);

        setInterimText("");
      } else {
        setInterimText(result.text);
      }
    },
    [translateRow]
  );

  // ----------- Status Change Handler -----------

  const handleStatusChange = useCallback(
    (status: "idle" | "recording" | "paused") => {
      const wasActive =
        recordingStatus === "recording" || recordingStatus === "paused";

      // Start MediaRecorder when recording starts (Pro Max)
      if (status === "recording" && recordingStatus === "idle") {
        startMediaRecorder();
      }

      if (wasActive && status === "idle" && tableRows.length > 0) {
        // Stop MediaRecorder
        stopMediaRecorder();

        const recId = saveRecording({
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
        lastRecordingIdRef.current = recId;

        setViewMode("post-meeting");
      }
      setRecordingStatus(status);
    },
    [
      recordingStatus,
      tableRows,
      sourceLang,
      targetLang,
      analyses,
      startMediaRecorder,
      stopMediaRecorder,
    ]
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

  // ----------- Enhanced STT (Pro Max) -----------

  const enhanceTranscript = useCallback(async () => {
    if (!proMode || !token || audioChunksRef.current.length === 0) return;

    setEnhancing(true);
    setEnhanceMessage("Enhancing transcript with AI...");

    try {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });

      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("language", sourceLang);

      const res = await fetch("/api/stt/enhance", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        setEnhanceMessage(err.error || "Enhancement failed");
        return;
      }

      const data = await res.json();

      if (data.text) {
        // Replace transcript with enhanced version
        const segments = data.segments;
        if (segments && segments.length > 0) {
          const newRows: TableRow[] = segments.map(
            (seg: { text: string; start: number }) => ({
              text: seg.text.trim(),
              startTime: Math.floor(seg.start),
            })
          );
          setTableRows(newRows);
          setEnhanceMessage(
            `Enhanced! ${data.hours_remaining != null ? `${data.hours_remaining.toFixed(1)}h remaining this month` : ""}`
          );
        } else {
          // Single text block — replace all rows with one
          setTableRows([{ text: data.text, startTime: 0 }]);
          setEnhanceMessage("Enhanced transcript ready!");
        }

        // Re-translate enhanced rows
        // (will happen naturally via existing translation logic on next recording)
      }
    } catch (err) {
      setEnhanceMessage("Enhancement failed. Please try again.");
      console.error("STT enhance error:", err);
    } finally {
      setEnhancing(false);
    }
  }, [proMode, token, sourceLang]);

  // ----------- Post-meeting Summary -----------

  useEffect(() => {
    if (viewMode !== "post-meeting" || tableRows.length === 0) return;

    const fullTranscript = tableRows.map((r) => r.text).join(" ");
    if (!fullTranscript.trim()) return;

    let cancelled = false;

    (async () => {
      setIsSummarizing(true);
      setMeetingSummary("");

      // Helper: persist summary to saved recording
      const persistSummary = (summary: string) => {
        if (lastRecordingIdRef.current && summary) {
          updateRecording(lastRecordingIdRef.current, { summary });
        }
      };

      if (proMode && token) {
        proStreamLLM(
          "/api/llm/summarize",
          { transcript: fullTranscript, targetLang, knowledgeContext: kbContext },
          token,
          (fullText) => {
            if (!cancelled) setMeetingSummary(fullText);
          },
          (fullText) => {
            if (!cancelled) {
              setIsSummarizing(false);
              persistSummary(fullText);
            }
          },
          (err) => {
            console.error("Summary error:", err);
            if (!cancelled) setIsSummarizing(false);
          }
        );
      } else {
        const ai = await getAI();
        if (!ai || cancelled) return;

        let accumulated = "";
        ai.streamSummary(
          fullTranscript,
          targetLang,
          (t) => {
            if (!cancelled) {
              accumulated += t;
              setMeetingSummary((prev) => prev + t);
            }
          },
          () => {
            if (!cancelled) {
              setIsSummarizing(false);
              persistSummary(accumulated);
            }
          },
          (err) => {
            console.error("Summary error:", err);
            if (!cancelled) setIsSummarizing(false);
          }
        );
      }
    })();

    setTimeout(() => {
      summaryRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 600);

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  // ----------- New Recording -----------

  const handleNewRecording = useCallback(() => {
    setViewMode("recording");
    setTableRows([]);
    setInterimText("");
    setAnalyses([]);
    setStreamingAnalysis("");
    setIsAnalyzing(false);
    setMeetingSummary("");
    setIsSummarizing(false);
    setEnhancing(false);
    setEnhanceMessage("");
    elapsedRef.current = 0;
    rowCountRef.current = 0;
    lastRecordingIdRef.current = "";
    audioChunksRef.current = [];
  }, []);

  // Display name
  const providerDisplayName = proMode
    ? "DeepSeek (Pro Max)"
    : settings.provider
      ? settings.provider.charAt(0).toUpperCase() + settings.provider.slice(1)
      : "Gemini";

  // ===== POST-MEETING VIEW =====
  if (viewMode === "post-meeting") {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex flex-col">
        <div className="h-14 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-300">
              Meeting Complete
            </span>
            {proMode && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                <Crown className="w-3 h-3" /> Pro Max
              </span>
            )}
            <span className="text-xs text-slate-500">
              {tableRows.length} segments |{" "}
              {tableRows.filter((r) => r.translation).length} translations |{" "}
              {analyses.length} analyses
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Pro Max: Enhance button */}
            {proMode && audioChunksRef.current.length > 0 && (
              <button
                onClick={enhanceTranscript}
                disabled={enhancing}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg transition text-sm disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {enhancing ? "Enhancing..." : "Enhance Transcript"}
              </button>
            )}
            <button
              onClick={handleNewRecording}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition text-sm"
            >
              New Recording
            </button>
          </div>
        </div>

        {enhanceMessage && (
          <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
            {enhancing && <Loader2 className="w-3 h-3 animate-spin" />}
            {enhanceMessage}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
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
                isAnalyzing={isAnalyzing}
                onAnalyze={triggerAnalysis}
              />
            </div>
          </div>

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
      <div className="h-14 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <AudioRecorder
            sourceLang={sourceLang}
            onResult={handleSpeechResult}
            onStatusChange={handleStatusChange}
          />
          {proMode && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
              <Crown className="w-3 h-3" /> Pro
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
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

      {showConfig && (
        <div className="border-b border-slate-700 bg-slate-800/30 px-4 py-3 space-y-2">
          <div className="flex flex-wrap gap-4 text-xs text-slate-400">
            <span>
              ASR: Web Speech API (free){proMode ? " + Enhanced STT" : ""}
            </span>
            <span>|</span>
            <span>LLM: {providerDisplayName}</span>
            <span>|</span>
            <span>
              Analysis interval: {getSettings().analysisInterval}s
            </span>
            {proMode && profile && (
              <>
                <span>|</span>
                <span className="text-amber-400">
                  STT: {(10 - (profile.stt_hours_used || 0)).toFixed(1)}h
                  remaining
                </span>
              </>
            )}
          </div>
          {/* Knowledge Base (Pro Max only) */}
          {proMode && <KnowledgeBase onContextChange={setKbContext} />}
        </div>
      )}

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
            isAnalyzing={isAnalyzing}
            onAnalyze={triggerAnalysis}
          />
        </div>
      </div>

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

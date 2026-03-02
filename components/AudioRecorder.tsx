"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square, Pause, Play } from "lucide-react";
import { SpeechCapture, SpeechResult, formatTime } from "@/lib/speech";

interface Props {
  sourceLang: string;
  onResult: (result: SpeechResult) => void;
  onStatusChange: (status: "idle" | "recording" | "paused") => void;
}

export default function AudioRecorder({
  sourceLang,
  onResult,
  onStatusChange,
}: Props) {
  const [status, setStatus] = useState<"idle" | "recording" | "paused">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [speechError, setSpeechError] = useState("");

  const speechRef = useRef<SpeechCapture | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const updateStatus = useCallback(
    (s: "idle" | "recording" | "paused") => {
      setStatus(s);
      onStatusChange(s);
    },
    [onStatusChange]
  );

  const startRecording = useCallback(() => {
    if (!SpeechCapture.isSupported()) {
      alert(
        "Web Speech API is not supported in this browser.\nPlease use Chrome or Edge."
      );
      return;
    }

    setSpeechError("");
    const speech = new SpeechCapture();
    speechRef.current = speech;

    speech.onResult = (result) => {
      setSpeechError(""); // Clear error on successful result
      onResult(result);
    };

    speech.onError = (error) => {
      console.error("Speech recognition error:", error);
      setSpeechError(`Speech error: ${error}`);
    };

    speech.onEnd = () => {
      // Speech engine stopped (shouldn't happen if auto-restart works)
    };

    speech.start(sourceLang);
    updateStatus("recording");

    // Start timer
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  }, [sourceLang, onResult, updateStatus]);

  const pauseRecording = useCallback(() => {
    speechRef.current?.pause();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    updateStatus("paused");
  }, [updateStatus]);

  const resumeRecording = useCallback(() => {
    speechRef.current?.resume();
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    updateStatus("recording");
  }, [updateStatus]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    speechRef.current?.stop();
    speechRef.current = null;
    updateStatus("idle");
  }, [updateStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      speechRef.current?.stop();
    };
  }, []);

  return (
    <div className="flex items-center gap-4">
      {status === "idle" ? (
        <button
          onClick={startRecording}
          className="flex items-center gap-2 px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition font-medium text-sm"
        >
          <Mic className="w-4 h-4" />
          Start Recording
        </button>
      ) : (
        <>
          {/* Recording / Paused indicator */}
          <div className="flex items-center gap-2">
            {status === "paused" ? (
              <>
                <div className="w-3 h-3 rounded-full bg-amber-500 paused-pulse" />
                <span className="text-sm font-mono text-amber-400">
                  PAUSED {formatTime(elapsed)}
                </span>
              </>
            ) : (
              <>
                <div className="w-3 h-3 rounded-full bg-red-500 recording-pulse" />
                <span className="text-sm font-mono text-red-400">
                  REC {formatTime(elapsed)}
                </span>
              </>
            )}
          </div>

          {/* Pause / Resume */}
          {status === "paused" ? (
            <button
              onClick={resumeRecording}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition text-sm"
            >
              <Play className="w-4 h-4" />
              Resume
            </button>
          ) : (
            <button
              onClick={pauseRecording}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition text-sm"
            >
              <Pause className="w-4 h-4" />
              Pause
            </button>
          )}

          {/* Stop */}
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-sm"
          >
            <Square className="w-4 h-4" />
            Stop
          </button>

          {/* Error display */}
          {speechError && (
            <span className="text-xs text-red-400 ml-2">{speechError}</span>
          )}
        </>
      )}
    </div>
  );
}

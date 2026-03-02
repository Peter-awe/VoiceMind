"use client";

import { useState, useEffect } from "react";
import { KeyRound, ExternalLink, Check, Loader2, AlertTriangle } from "lucide-react";
import { setApiKey, hasApiKey } from "@/lib/storage";

interface Props {
  children: React.ReactNode;
}

export default function ApiKeyGuard({ children }: Props) {
  const [keyExists, setKeyExists] = useState<boolean | null>(null); // null = loading
  const [inputKey, setInputKey] = useState("");
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    setKeyExists(hasApiKey());
  }, []);

  // Still checking
  if (keyExists === null) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  // Key exists, render children
  if (keyExists) {
    return <>{children}</>;
  }

  // No key — show setup guide
  const handleValidate = async () => {
    const key = inputKey.trim();
    if (!key) {
      setError("Please enter your API key");
      return;
    }

    setValidating(true);
    setError("");

    try {
      // Validate directly from browser — no server round-trip needed
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
      );

      if (res.ok) {
        setApiKey(key);
        setValidated(true);
        setTimeout(() => setKeyExists(true), 800);
      } else {
        setError("Invalid API key. Please check and try again.");
      }
    } catch {
      setError("Connection failed. Please check your network and try again.");
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] px-4">
      <div className="max-w-lg w-full">
        <div className="panel p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Configure Gemini API Key
              </h2>
              <p className="text-sm text-slate-400">
                Free, no credit card required
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4 mb-8">
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center shrink-0 text-xs font-bold text-slate-300">
                1
              </div>
              <div>
                <p className="text-sm text-slate-200">
                  Visit Google AI Studio
                </p>
                <a
                  href="https://aistudio.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1"
                >
                  aistudio.google.com
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center shrink-0 text-xs font-bold text-slate-300">
                2
              </div>
              <p className="text-sm text-slate-200">
                Click &quot;Create API Key&quot; and copy the key
              </p>
            </div>

            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center shrink-0 text-xs font-bold text-slate-300">
                3
              </div>
              <p className="text-sm text-slate-200">
                Paste your API key below
              </p>
            </div>
          </div>

          {/* Input */}
          <div className="space-y-3">
            <input
              type="password"
              value={inputKey}
              onChange={(e) => {
                setInputKey(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleValidate();
              }}
              placeholder="Paste your Gemini API key here..."
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
            />

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs">
                <AlertTriangle className="w-3.5 h-3.5" />
                {error}
              </div>
            )}

            {validated && (
              <div className="flex items-center gap-2 text-green-400 text-xs">
                <Check className="w-3.5 h-3.5" />
                API key verified! Redirecting...
              </div>
            )}

            <button
              onClick={handleValidate}
              disabled={validating || validated}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition text-sm font-medium flex items-center justify-center gap-2"
            >
              {validating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Validating...
                </>
              ) : validated ? (
                <>
                  <Check className="w-4 h-4" />
                  Verified
                </>
              ) : (
                "Validate & Save"
              )}
            </button>
          </div>

          {/* Privacy note */}
          <p className="text-xs text-slate-500 mt-4 text-center">
            Your API key is stored locally in your browser and never sent to our servers.
          </p>
        </div>
      </div>
    </div>
  );
}

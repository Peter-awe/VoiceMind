"use client";

import { useState, useEffect } from "react";
import { KeyRound, ExternalLink, Check, Loader2, AlertTriangle } from "lucide-react";
import { setApiKey, hasApiKey, getProvider, setProvider } from "@/lib/storage";
import { PROVIDERS, getProviderInfo, getProvider as createProvider } from "@/lib/ai-provider";
import type { ProviderName } from "@/lib/ai-provider";

interface Props {
  children: React.ReactNode;
}

export default function ApiKeyGuard({ children }: Props) {
  const [keyExists, setKeyExists] = useState<boolean | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ProviderName>("gemini");
  const [inputKey, setInputKey] = useState("");
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    const p = getProvider();
    setSelectedProvider(p);
    setKeyExists(hasApiKey(p));
  }, []);

  if (keyExists === null) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (keyExists) {
    return <>{children}</>;
  }

  const info = getProviderInfo(selectedProvider);

  const handleProviderChange = (name: ProviderName) => {
    setSelectedProvider(name);
    setProvider(name);
    setInputKey("");
    setError("");
    setValidated(false);
    // Check if this provider already has a key
    if (hasApiKey(name)) {
      setKeyExists(true);
    }
  };

  const handleValidate = async () => {
    const key = inputKey.trim();
    if (!key) {
      setError("Please enter your API key");
      return;
    }

    setValidating(true);
    setError("");

    try {
      const provider = await createProvider(selectedProvider, key);
      const valid = await provider.validateKey();

      if (valid) {
        setApiKey(key, selectedProvider);
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
                Choose AI Provider
              </h2>
              <p className="text-sm text-slate-400">
                Select your preferred AI service
              </p>
            </div>
          </div>

          {/* Provider Selection */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {PROVIDERS.map((p) => (
              <button
                key={p.name}
                onClick={() => handleProviderChange(p.name)}
                className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition ${
                  selectedProvider === p.name
                    ? "border-blue-500 bg-blue-500/20 text-blue-300"
                    : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500"
                }`}
              >
                {p.displayName}
              </button>
            ))}
          </div>

          {/* Provider Info */}
          <div className="bg-slate-700/30 rounded-lg p-4 mb-6 space-y-2">
            <p className="text-sm text-slate-300">{info.description}</p>
            <p className="text-xs text-slate-500">{info.freeInfo}</p>
            <a
              href={info.keyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1"
            >
              Get API Key: {info.keyUrlLabel}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Key Input */}
          <div className="space-y-3">
            <input
              type="password"
              value={inputKey}
              onChange={(e) => { setInputKey(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleValidate(); }}
              placeholder={`Paste your ${info.displayName} API key (${info.keyPlaceholder})`}
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
                <><Loader2 className="w-4 h-4 animate-spin" /> Validating...</>
              ) : validated ? (
                <><Check className="w-4 h-4" /> Verified</>
              ) : (
                "Validate & Save"
              )}
            </button>
          </div>

          <p className="text-xs text-slate-500 mt-4 text-center">
            Your API key is stored locally in your browser and never sent to our servers.
          </p>
        </div>
      </div>
    </div>
  );
}

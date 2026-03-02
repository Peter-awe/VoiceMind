"use client";

import { useState, useEffect } from "react";
import {
  KeyRound,
  Check,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Globe,
  Timer,
  Shield,
  Cpu,
} from "lucide-react";
import {
  getApiKey,
  setApiKey,
  removeApiKey,
  getSettings,
  saveSettings,
  AppSettings,
} from "@/lib/storage";
import {
  PROVIDERS,
  getProviderInfo,
  getProvider as createProvider,
} from "@/lib/ai-provider";
import type { ProviderName } from "@/lib/ai-provider";

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

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    sourceLang: "en",
    targetLang: "zh",
    analysisInterval: 30,
    provider: "gemini",
  });

  // API key state
  const [keyExists, setKeyExists] = useState(false);
  const [maskedKey, setMaskedKey] = useState("");
  const [editingKey, setEditingKey] = useState(false);
  const [inputKey, setInputKey] = useState("");
  const [validating, setValidating] = useState(false);
  const [keyError, setKeyError] = useState("");
  const [keySuccess, setKeySuccess] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const s = getSettings();
    setSettings(s);
    refreshKeyState(s.provider);
  }, []);

  function refreshKeyState(provider: ProviderName) {
    const key = getApiKey(provider);
    setKeyExists(!!key);
    setMaskedKey(key ? key.slice(0, 4) + "****" + key.slice(-4) : "");
    setEditingKey(false);
    setInputKey("");
    setKeyError("");
  }

  const handleProviderChange = (name: ProviderName) => {
    const newSettings = { ...settings, provider: name };
    setSettings(newSettings);
    saveSettings({ provider: name });
    refreshKeyState(name);
    showSaved();
  };

  const handleValidateKey = async () => {
    const key = inputKey.trim();
    if (!key) {
      setKeyError("Please enter your API key");
      return;
    }

    setValidating(true);
    setKeyError("");

    try {
      const provider = await createProvider(settings.provider, key);
      const valid = await provider.validateKey();

      if (valid) {
        setApiKey(key, settings.provider);
        refreshKeyState(settings.provider);
        setKeySuccess(true);
        setTimeout(() => setKeySuccess(false), 3000);
      } else {
        setKeyError("Invalid API key. Please check and try again.");
      }
    } catch {
      setKeyError("Connection failed. Please try again.");
    } finally {
      setValidating(false);
    }
  };

  const handleRemoveKey = () => {
    if (
      !confirm(
        "Remove your API key? You will need to re-enter it to use translation and analysis features."
      )
    )
      return;
    removeApiKey(settings.provider);
    refreshKeyState(settings.provider);
  };

  function showSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const handleSaveSettings = (updates: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    saveSettings(newSettings);
    showSaved();
  };

  const info = getProviderInfo(settings.provider);

  return (
    <div className="max-w-2xl mx-auto py-10 px-6 space-y-8">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {/* ===== AI Provider Section ===== */}
      <div className="panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <Cpu className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-slate-200">
            AI Provider
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {PROVIDERS.map((p) => (
            <button
              key={p.name}
              onClick={() => handleProviderChange(p.name)}
              className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition text-left ${
                settings.provider === p.name
                  ? "border-blue-500 bg-blue-500/20 text-blue-300"
                  : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500"
              }`}
            >
              <div>{p.displayName}</div>
              <div className="text-[10px] mt-0.5 opacity-60">{p.freeInfo}</div>
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-500">
          {info.description}
        </p>
      </div>

      {/* ===== API Key Section ===== */}
      <div className="panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <KeyRound className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-slate-200">
            {info.displayName} API Key
          </h2>
          {keyExists && !editingKey && (
            <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full">
              <Check className="w-3 h-3" />
              Configured
            </span>
          )}
        </div>

        {keyExists && !editingKey ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <code className="text-sm text-slate-400 bg-slate-700/50 px-3 py-1.5 rounded font-mono">
                {maskedKey}
              </code>
              <button
                onClick={() => setEditingKey(true)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Change
              </button>
              <button
                onClick={handleRemoveKey}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            </div>
            {keySuccess && (
              <div className="flex items-center gap-2 text-green-400 text-xs">
                <Check className="w-3.5 h-3.5" />
                API key updated successfully!
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {!keyExists && (
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                API key not configured for {info.displayName}.
              </div>
            )}

            <div className="bg-slate-700/30 rounded-lg p-4 space-y-2">
              <p className="text-sm text-slate-300">Get your API key:</p>
              <a
                href={info.keyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
              >
                {info.keyUrlLabel}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex gap-2">
              <input
                type="password"
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value);
                  setKeyError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleValidateKey();
                }}
                placeholder={`Paste your API key (${info.keyPlaceholder})`}
                className="flex-1 px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleValidateKey}
                disabled={validating}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
              >
                {validating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Validate"
                )}
              </button>
              {editingKey && (
                <button
                  onClick={() => {
                    setEditingKey(false);
                    setInputKey("");
                    setKeyError("");
                  }}
                  className="px-3 py-2.5 text-slate-400 hover:text-white text-sm"
                >
                  Cancel
                </button>
              )}
            </div>

            {keyError && (
              <div className="flex items-center gap-2 text-red-400 text-xs">
                <AlertTriangle className="w-3.5 h-3.5" />
                {keyError}
              </div>
            )}

            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Your key is stored locally in your browser and never sent to our servers.
            </p>
          </div>
        )}
      </div>

      {/* ===== Language Settings ===== */}
      <div className="panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-5 h-5 text-green-400" />
          <h2 className="text-lg font-semibold text-slate-200">
            Language Settings
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              Default Source Language
            </label>
            <select
              value={settings.sourceLang}
              onChange={(e) =>
                handleSaveSettings({ sourceLang: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-200"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              Default Target Language
            </label>
            <select
              value={settings.targetLang}
              onChange={(e) =>
                handleSaveSettings({ targetLang: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-200"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ===== Analysis Settings ===== */}
      <div className="panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <Timer className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-slate-200">
            Analysis Settings
          </h2>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">
            Analysis Interval (seconds)
          </label>
          <select
            value={settings.analysisInterval}
            onChange={(e) =>
              handleSaveSettings({
                analysisInterval: Number(e.target.value),
              })
            }
            className="w-48 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-200"
          >
            <option value={30}>30 seconds</option>
            <option value={45}>45 seconds</option>
            <option value={60}>60 seconds</option>
          </select>
          <p className="text-xs text-slate-500 mt-1.5">
            How often AI analyzes the conversation during recording.
          </p>
        </div>
      </div>

      {/* Save indicator */}
      {saved && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg shadow-lg segment-enter">
          <Check className="w-4 h-4" />
          Settings saved
        </div>
      )}
    </div>
  );
}

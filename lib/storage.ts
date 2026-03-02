// ============================================================
// storage.ts — localStorage wrapper for VoiceMind Light
// Manages: API Key, Settings, Recordings
// ============================================================

// --------------- Types ---------------

export interface AppSettings {
  sourceLang: string;
  targetLang: string;
  analysisInterval: number; // seconds
}

export interface RecordingRow {
  text: string;
  translation?: string;
  startTime: number;
}

export interface Recording {
  id: string;
  title: string;
  date: string; // ISO string
  sourceLang: string;
  targetLang: string;
  duration: number; // seconds
  rows: RecordingRow[];
  analyses: string[];
  summary?: string;
}

// --------------- Keys ---------------

const KEY_API_KEY = "voicemind_gemini_api_key";
const KEY_SETTINGS = "voicemind_settings";
const KEY_RECORDINGS = "voicemind_recordings";

// --------------- API Key ---------------

export function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY_API_KEY);
}

export function setApiKey(key: string): void {
  localStorage.setItem(KEY_API_KEY, key);
}

export function removeApiKey(): void {
  localStorage.removeItem(KEY_API_KEY);
}

export function hasApiKey(): boolean {
  return !!getApiKey();
}

// --------------- Settings ---------------

const DEFAULT_SETTINGS: AppSettings = {
  sourceLang: "en",
  targetLang: "zh",
  analysisInterval: 30,
};

export function getSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(KEY_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Partial<AppSettings>): void {
  const current = getSettings();
  localStorage.setItem(
    KEY_SETTINGS,
    JSON.stringify({ ...current, ...settings })
  );
}

// --------------- Recordings ---------------

function getAllRecordings(): Recording[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY_RECORDINGS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function persistRecordings(recordings: Recording[]): void {
  localStorage.setItem(KEY_RECORDINGS, JSON.stringify(recordings));
}

export function saveRecording(data: Omit<Recording, "id" | "date">): string {
  const id = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const recording: Recording = {
    ...data,
    id,
    date: new Date().toISOString(),
  };
  const all = getAllRecordings();
  all.unshift(recording); // newest first
  persistRecordings(all);
  return id;
}

export function listRecordings(): Recording[] {
  return getAllRecordings();
}

export function getRecording(id: string): Recording | null {
  return getAllRecordings().find((r) => r.id === id) || null;
}

export function deleteRecording(id: string): void {
  const all = getAllRecordings().filter((r) => r.id !== id);
  persistRecordings(all);
}

export function exportRecording(
  id: string,
  format: "md" | "txt" = "md"
): string | null {
  const rec = getRecording(id);
  if (!rec) return null;

  if (format === "md") {
    let md = `# ${rec.title}\n\n`;
    md += `**Date:** ${new Date(rec.date).toLocaleString()}\n\n`;
    md += `**Languages:** ${rec.sourceLang} -> ${rec.targetLang}\n\n`;
    md += `---\n\n## Transcript\n\n`;
    for (const row of rec.rows) {
      md += `**[${formatDuration(row.startTime)}]** ${row.text}\n\n`;
      if (row.translation) {
        md += `> ${row.translation}\n\n`;
      }
    }
    if (rec.analyses.length > 0) {
      md += `---\n\n## AI Analyses\n\n`;
      for (const a of rec.analyses) {
        md += `${a}\n\n---\n\n`;
      }
    }
    if (rec.summary) {
      md += `---\n\n## Meeting Summary\n\n${rec.summary}\n`;
    }
    return md;
  }

  // Plain text
  let txt = `${rec.title}\n`;
  txt += `Date: ${new Date(rec.date).toLocaleString()}\n`;
  txt += `Languages: ${rec.sourceLang} -> ${rec.targetLang}\n\n`;
  for (const row of rec.rows) {
    txt += `[${formatDuration(row.startTime)}] ${row.text}\n`;
    if (row.translation) txt += `  -> ${row.translation}\n`;
    txt += "\n";
  }
  if (rec.summary) {
    txt += `\n=== Meeting Summary ===\n\n${rec.summary}\n`;
  }
  return txt;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

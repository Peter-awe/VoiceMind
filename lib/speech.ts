// ============================================================
// speech.ts — Web Speech API wrapper for VoiceMind Light
// Provides: SpeechCapture class (browser-native ASR, free)
// ============================================================

// BCP-47 language code mapping
const LANG_MAP: Record<string, string> = {
  en: "en-US",
  zh: "zh-CN",
  ja: "ja-JP",
  ko: "ko-KR",
  fr: "fr-FR",
  de: "de-DE",
  es: "es-ES",
  pt: "pt-BR",
  ru: "ru-RU",
  ar: "ar-SA",
};

export interface SpeechResult {
  text: string;
  isFinal: boolean;
}

export class SpeechCapture {
  private recognition: SpeechRecognition | null = null;
  private _running = false;
  private _paused = false;
  private _lang = "en-US";

  // Callbacks
  onResult: ((result: SpeechResult) => void) | null = null;
  onError: ((error: string) => void) | null = null;
  onEnd: (() => void) | null = null;

  /**
   * Check if Web Speech API is available
   */
  static isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * Start speech recognition
   */
  start(lang: string): void {
    if (!SpeechCapture.isSupported()) {
      this.onError?.("Web Speech API is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    this._lang = LANG_MAP[lang] || lang;
    this._running = true;
    this._paused = false;
    this._createAndStart();
  }

  private _createAndStart(): void {
    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognitionClass();
    this.recognition = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = this._lang;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Process only the latest result
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript.trim();
        if (text) {
          this.onResult?.({
            text,
            isFinal: result.isFinal,
          });
        }
      }
    };

    recognition.onend = () => {
      // Auto-restart if still running and not paused
      // Chrome silently stops after ~60 seconds of continuous listening
      if (this._running && !this._paused) {
        try {
          setTimeout(() => {
            if (this._running && !this._paused) {
              this._createAndStart();
            }
          }, 100);
        } catch {
          // If restart fails, notify
          this.onEnd?.();
        }
      } else if (!this._running) {
        this.onEnd?.();
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // 'aborted' is normal — happens when we call stop()
      if (event.error === "aborted") {
        return;
      }
      // Show all errors including 'no-speech', 'network', 'not-allowed', etc.
      this.onError?.(event.error);
    };

    try {
      recognition.start();
    } catch (err) {
      // May throw if already started
      console.warn("Speech recognition start error:", err);
    }
  }

  /**
   * Pause speech recognition
   */
  pause(): void {
    this._paused = true;
    try {
      this.recognition?.stop();
    } catch {
      // ignore
    }
  }

  /**
   * Resume speech recognition
   */
  resume(): void {
    this._paused = false;
    if (this._running) {
      this._createAndStart();
    }
  }

  /**
   * Stop speech recognition permanently
   */
  stop(): void {
    this._running = false;
    this._paused = false;
    try {
      this.recognition?.stop();
    } catch {
      // ignore
    }
    this.recognition = null;
  }

  isActive(): boolean {
    return this._running && !this._paused;
  }

  isPaused(): boolean {
    return this._paused;
  }
}

/**
 * Format seconds to MM:SS
 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

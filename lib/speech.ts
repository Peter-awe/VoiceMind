// ============================================================
// speech.ts — Web Speech API wrapper for VoiceMind Light
// Provides: SpeechCapture class (browser-native ASR, free)
// ============================================================

export interface SpeechResult {
  text: string;
  isFinal: boolean;
}

export class SpeechCapture {
  private recognition: SpeechRecognition | null = null;
  private _running = false;
  private _paused = false;
  private _lang = "";
  private _triedFallback = false;

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

    this._lang = lang;
    this._running = true;
    this._paused = false;
    this._triedFallback = false;
    this._createAndStart();
  }

  private _createAndStart(): void {
    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognitionClass();
    this.recognition = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // Set language — try the code directly, Chrome accepts both "en" and "en-US"
    if (this._lang) {
      recognition.lang = this._lang;
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
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
      if (this._running && !this._paused) {
        setTimeout(() => {
          if (this._running && !this._paused) {
            this._createAndStart();
          }
        }, 100);
      } else if (!this._running) {
        this.onEnd?.();
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "aborted") {
        return;
      }

      // If language not supported, retry without specifying language
      if (event.error === "language-not-supported" && !this._triedFallback) {
        this._triedFallback = true;
        this._lang = ""; // Use browser default
        console.warn("Language not supported, falling back to browser default");
        try {
          this.recognition?.stop();
        } catch {
          // ignore
        }
        setTimeout(() => {
          if (this._running && !this._paused) {
            this._createAndStart();
          }
        }, 200);
        return;
      }

      this.onError?.(event.error);
    };

    try {
      recognition.start();
    } catch (err) {
      console.warn("Speech recognition start error:", err);
    }
  }

  pause(): void {
    this._paused = true;
    try {
      this.recognition?.stop();
    } catch {
      // ignore
    }
  }

  resume(): void {
    this._paused = false;
    if (this._running) {
      this._createAndStart();
    }
  }

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

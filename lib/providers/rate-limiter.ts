// ============================================================
// rate-limiter.ts — Reusable rate limiter for AI providers
// Serial queue with min gap, global 429 cooldown, tag-based cancel
// ============================================================

function sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)); }

export class RateLimiter {
  private queue: Array<{ fn: () => Promise<void>; tag: string }> = [];
  private busy = false;
  private lastReqTime = 0;
  private cooldownUntil = 0;

  constructor(
    private minGapMs: number = 4000,
    private cooldownMs: number = 60_000
  ) {}

  enterCooldown() {
    this.cooldownUntil = Date.now() + this.cooldownMs;
    this.queue.length = 0; // clear pending
    console.warn(`⏸ Rate limited — paused ${this.cooldownMs / 1000}s`);
  }

  isCoolingDown() {
    return Date.now() < this.cooldownUntil;
  }

  cancelQueued(tag: string) {
    for (let i = this.queue.length - 1; i >= 0; i--) {
      if (this.queue[i].tag === tag) this.queue.splice(i, 1);
    }
  }

  enqueue(tag: string, fn: () => Promise<void>) {
    this.queue.push({ fn, tag });
    this.drain();
  }

  private async drain() {
    if (this.busy) return;
    this.busy = true;

    while (this.queue.length > 0) {
      if (this.isCoolingDown()) {
        const wait = this.cooldownUntil - Date.now();
        console.log(`⏸ Cooldown — waiting ${Math.ceil(wait / 1000)}s`);
        await sleep(wait);
      }

      const item = this.queue.shift()!;
      const gap = this.minGapMs - (Date.now() - this.lastReqTime);
      if (gap > 0) await sleep(gap);
      this.lastReqTime = Date.now();

      try {
        await item.fn();
      } catch (e) {
        console.error(`[rate-limiter] ${item.tag}:`, e);
      }
    }

    this.busy = false;
  }
}

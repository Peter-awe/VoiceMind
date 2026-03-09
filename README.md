<div align="center">
  <img src="public/icons/icon-512.png" alt="KiwiPenNotes Logo" width="128" />

  # KiwiPenNotes

  **AI-Powered Real-Time Meeting Transcription, Translation & Analysis**

  [![Website](https://img.shields.io/website?url=https%3A%2F%2Fkiwipennotes.com&label=kiwipennotes.com&style=flat-square)](https://kiwipennotes.com)
  [![Deploy Status](https://img.shields.io/github/actions/workflow/status/Peter-awe/KiwiPenNotes/deploy.yml?label=deploy&style=flat-square&logo=cloudflare)](https://github.com/Peter-awe/KiwiPenNotes/actions)
  [![License](https://img.shields.io/badge/license-BSL--1.1-blue?style=flat-square)](LICENSE)
  [![GitHub stars](https://img.shields.io/github/stars/Peter-awe/KiwiPenNotes?style=flat-square&logo=github)](https://github.com/Peter-awe/KiwiPenNotes/stargazers)
  [![GitHub forks](https://img.shields.io/github/forks/Peter-awe/KiwiPenNotes?style=flat-square&logo=github)](https://github.com/Peter-awe/KiwiPenNotes/network)

  **[中文版](README_zh.md)** | English

  [Try it Now](https://kiwipennotes.com) · [Download Desktop](https://github.com/Peter-awe/KiwiPenNotes/releases) · [Report Bug](https://github.com/Peter-awe/KiwiPenNotes/issues)

</div>

---

> KiwiPenNotes is a **free, privacy-first** AI meeting assistant. Real-time transcription, live translation across 10+ languages, and intelligent analysis — all running in your browser with **zero signup required**.

---

## Key Features

<table>
<tr>
<td width="50%">

### Real-time Transcription

Powered by browser-native Web Speech API — works offline, zero latency, unlimited usage. No account needed.

</td>
<td width="50%">

### Live Translation

Simultaneous translation across 10+ languages. Free tier uses browser translation; Plus/Pro uses LLM-powered high-quality translation.

</td>
</tr>
<tr>
<td width="50%">

### AI Analysis

Automatically extracts key topics, action items, and decisions in real-time. Generate structured meeting summaries with one click.

</td>
<td width="50%">

### Privacy First

All free-tier data stays in your browser — we never access your recordings. No tracking, no data collection, no strings attached.

</td>
</tr>
<tr>
<td width="50%">

### Knowledge Base (Pro)

Upload papers, lecture slides, and documents. AI cross-references your materials during meetings for deeper insights.

</td>
<td width="50%">

### 30-Second Onboarding

Click, allow microphone, start recording. That's it. No configuration, no downloads, no credit card.

</td>
</tr>
</table>

---

## Platforms

| Platform | Status | Description |
|:--------:|:------:|:------------|
| **Web** | Available | Chrome / Edge, no download needed. All core features free. |
| **macOS Desktop** | Available | Native Electron app, Apple Silicon + Intel. Code in [`desktop/`](desktop/) directory. [Download](https://github.com/Peter-awe/KiwiPenNotes/releases) |
| **iOS** | PWA | Add to Home Screen via Safari for a native app experience. |

---

## Supported Languages

KiwiPenNotes supports transcription and translation in **10+ languages**:

| Language | Code | Language | Code |
|:---------|:-----|:---------|:-----|
| English | `en-US` | Chinese | `zh-CN` |
| Japanese | `ja-JP` | Korean | `ko-KR` |
| French | `fr-FR` | German | `de-DE` |
| Spanish | `es-ES` | Portuguese | `pt-BR` |
| Russian | `ru-RU` | Arabic | `ar-SA` |

> Interface available in **English** and **Simplified Chinese**, switchable in real-time.

---

## Pricing

All prices in CAD. Free tier is truly unlimited on core features — no trial, no expiration.

| | **Free** | **Plus** | **Pro Max** |
|:---|:---:|:---:|:---:|
| **Price** | $0 | $1.99/mo | $9.99/mo |
| **Yearly** | — | $19.99/yr | $99.99/yr |
| Real-time Transcription | Unlimited | Unlimited | Unlimited |
| Live Translation | Basic | LLM x 50/day | LLM x 200/day |
| AI Analysis | Basic | Deep x 5/day | Deep x 60/day |
| Meeting Summary | — | 2/day | 10/day |
| Knowledge Base | — | — | Yes |
| Whisper STT | — | — | 10hr/mo |
| Support | Community | Community | Priority |

---

## Why KiwiPenNotes?

<table>
<tr>
<td>

**Truly Free Core** — Unlike competitors that gate basic features behind paywalls, our transcription and basic translation are free forever.

</td>
</tr>
<tr>
<td>

**Local-First Privacy** — Free tier data never leaves your browser. No account needed. No server-side storage.

</td>
</tr>
<tr>
<td>

**Built for Researchers** — Designed for lab meetings, thesis defenses, international conferences, and supervisor calls.

</td>
</tr>
<tr>
<td>

**Multi-Provider AI** — Bring your own API key (Gemini, DeepSeek, Kimi, OpenAI, Claude, Qwen) or use our built-in service.

</td>
</tr>
<tr>
<td>

**10+ Languages** — Real-time transcription and translation in 10+ languages with bilingual interface.

</td>
</tr>
</table>

---

## Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=flat-square&logo=cloudflare&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=flat-square&logo=stripe&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-33-47848F?style=flat-square&logo=electron&logoColor=white)

| Layer | Technology |
|:------|:-----------|
| **Frontend** | Next.js 15, React 18, TailwindCSS, TypeScript |
| **Auth & Database** | Supabase (PostgreSQL + Row Level Security) |
| **Payments** | Stripe (subscriptions + webhook management) |
| **Deployment** | Cloudflare Workers via OpenNext |
| **Desktop** | Electron 33 (macOS, Apple Silicon + Intel) |
| **Mobile** | Progressive Web App (PWA) |
| **Email** | Resend (transactional emails) |
| **CI/CD** | GitHub Actions (auto-deploy on push) |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    Client (Browser)                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ Web Speech   │  │  Translation │  │  AI Analysis    │ │
│  │ API (STT)    │  │  Engine      │  │  (LLM Provider) │ │
│  └──────┬──────┘  └──────┬───────┘  └────────┬────────┘ │
│         │                │                    │          │
│  ┌──────▼────────────────▼────────────────────▼────────┐ │
│  │              React UI (Next.js 15)                   │ │
│  │   Transcript Panel │ Translation │ AI Sidebar        │ │
│  └──────────────────────────┬──────────────────────────┘ │
└─────────────────────────────┼────────────────────────────┘
                              │ HTTPS
┌─────────────────────────────▼────────────────────────────┐
│              Cloudflare Workers (Edge)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Auth API  │  │ Stripe   │  │ LLM Proxy│  │ Email   │ │
│  │ (Supabase)│  │ Webhooks │  │ (Pro)    │  │ (Resend)│ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└─────────────────────────────┬────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
    ┌────▼─────┐      ┌──────▼──────┐     ┌──────▼──────┐
    │ Supabase │      │   Stripe    │     │ LLM APIs    │
    │ (Auth+DB)│      │ (Payments)  │     │ (Multi-     │
    │          │      │             │     │  Provider)  │
    └──────────┘      └─────────────┘     └─────────────┘
```

---

## Getting Started (Development)

### Prerequisites

- **Node.js 20+** (LTS recommended)
- **npm** or **pnpm**
- A Supabase project (for auth & database)
- A Stripe account (for payments, optional for dev)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/Peter-awe/KiwiPenNotes.git
cd KiwiPenNotes

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase & Stripe keys

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Deploy to Cloudflare Workers

```bash
# Build with OpenNext for Cloudflare
npm run cf:build

# Preview locally
npm run cf:preview

# Deploy to production
npm run cf:deploy
```

> CI/CD is configured — every push to `main` triggers automatic deployment via GitHub Actions.

---

## Project Structure

```
KiwiPenNotes/
├── app/                       # Next.js App Router pages
│   ├── [locale]/              # i18n routing (en / zh)
│   │   ├── page.tsx           # Landing page
│   │   ├── app/               # Main app interface
│   │   ├── pricing/           # Pricing page
│   │   ├── download/          # Download page
│   │   └── account/           # Account management
│   └── api/                   # API routes
│       ├── stripe/            # Stripe webhooks & checkout
│       └── llm/               # LLM proxy for Pro users
├── components/                # React components
├── lib/                       # Utilities & configurations
├── public/
│   ├── icons/                 # App icons (favicon, PWA, Apple Touch)
│   ├── manifest.json          # PWA manifest
│   └── sw.js                  # Service worker
├── desktop/                   # Electron desktop app (macOS)
│   ├── main.js                # Electron main process
│   ├── preload.js             # Preload script
│   ├── package.json           # Desktop dependencies
│   ├── electron-builder.yml   # Build configuration
│   └── build/                 # Icons & entitlements
├── .github/workflows/
│   ├── deploy.yml             # CI/CD: GitHub Actions -> Cloudflare
│   └── build-desktop.yml      # CI/CD: Build macOS DMG
├── wrangler.jsonc             # Cloudflare Workers config
├── next.config.mjs            # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── LICENSE                    # BSL-1.1 License
├── README.md                  # English documentation
└── README_zh.md               # Chinese documentation
```

---

## Roadmap

- [x] Real-time transcription (Web Speech API)
- [x] Live translation (10+ languages)
- [x] AI analysis & meeting summaries
- [x] Multi-provider LLM support (6 providers)
- [x] Stripe subscription (Free / Plus / Pro Max)
- [x] PWA for iOS
- [x] macOS Desktop app (Electron)
- [x] Dark mode
- [x] Bilingual interface (EN / ZH)
- [ ] Windows Desktop app
- [ ] System audio capture (macOS)
- [ ] Collaborative meeting rooms
- [ ] Meeting recording playback
- [ ] WeChat Pay / Alipay integration

---

## License

This project is licensed under the **Business Source License 1.1 (BSL-1.1)**.

- **Personal, educational, and non-commercial use**: Free and unrestricted
- **Commercial use**: Requires a commercial license — [contact us](https://github.com/Peter-awe)
- **Change Date**: Converts to **MIT License** on **2030-03-01**

See [LICENSE](LICENSE) for full details.

---

## Acknowledgments

KiwiPenNotes is built with love for the international research community.

Special thanks to:

- [Supabase](https://supabase.com) — Auth & Database
- [Cloudflare Workers](https://workers.cloudflare.com) — Edge deployment
- [Stripe](https://stripe.com) — Payment infrastructure
- [OpenNext](https://opennext.js.org) — Next.js on Cloudflare
- The open-source community

---

## Contact

<div align="center">

**Built by [Ambrose Pan](https://github.com/Peter-awe)** · Montreal, Canada

[![Website](https://img.shields.io/badge/Website-kiwipennotes.com-45B7AA?style=for-the-badge&logo=google-chrome&logoColor=white)](https://kiwipennotes.com)
[![GitHub](https://img.shields.io/badge/GitHub-Peter--awe-181717?style=for-the-badge&logo=github)](https://github.com/Peter-awe)

---

If KiwiPenNotes helps you, give us a star!

</div>

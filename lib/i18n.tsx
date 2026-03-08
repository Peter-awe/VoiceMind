// ============================================================
// i18n.tsx — Locale context + translation dictionary (EN / ZH)
// Usage: wrap app in <LocaleProvider>, then use useLocale()
// ============================================================

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

export type Locale = "en" | "zh";

// ── Translation dictionary ──────────────────────────────────

const en = {
  nav: {
    features: "Features",
    pricing: "Pricing",
    download: "Download",
    record: "Record",
    library: "Library",
    settings: "Settings",
    signIn: "Sign In",
    signUp: "Sign Up",
  },
  hero: {
    badge: "100% Free — No credit card, no trial limits",
    title1: "Understand every meeting",
    title2: "in every language",
    subtitle:
      "Real-time transcription, instant translation, and AI-powered analysis. Built for international students and researchers who think across languages.",
    ctaBrowser: "Try Free in Browser",
    ctaMacOS: "Download for macOS",
    trustLine: "No sign-up required. Your data stays in your browser.",
  },
  demo: {
    title: "KiwiPenNotes — Recording Session",
    transcript: "Transcript",
    translation: "Translation",
    aiAnalysis: "AI Analysis",
    keyInsights: "Key Insights:",
    interim: "Statistical significance was...",
  },
  features: {
    title: "Everything you need. Nothing you have to pay for.",
    subtitle:
      "Professional-grade meeting tools, completely free. No hidden fees, no usage limits on core features.",
    cards: [
      {
        title: "Real-time Transcription",
        desc: "Instant speech-to-text powered by your browser's built-in engine. Works offline, zero latency, completely free.",
      },
      {
        title: "Live Translation",
        desc: "10+ languages supported. See translations appear alongside the original text in real-time as people speak.",
      },
      {
        title: "AI Context Analysis",
        desc: "AI identifies key topics, action items, and decisions during your meeting. Like having a smart assistant taking notes.",
      },
      {
        title: "Meeting Summary",
        desc: "When the meeting ends, get a structured summary with key points, action items, innovations, and open questions.",
      },
      {
        title: "10+ Languages",
        desc: "English, Chinese, Japanese, Korean, French, German, Spanish, Portuguese, Russian, and Arabic.",
      },
      {
        title: "Privacy First",
        desc: "All data stays in your browser. No account needed. Your recordings are stored locally — we never see them.",
      },
    ],
  },
  howItWorks: {
    title: "Start in 30 seconds",
    steps: [
      {
        title: "Open & Record",
        desc: 'Click "Start Recording" and allow microphone access. That\'s it. No sign-up, no download needed for the web version.',
      },
      {
        title: "Watch the magic",
        desc: "See your speech transcribed instantly on the left, with translations appearing on the right. AI analysis runs in the sidebar.",
      },
      {
        title: "Get your summary",
        desc: "Stop recording and scroll down for a full meeting summary with key points, action items, and innovations.",
      },
    ],
  },
  platforms: {
    title: "Available everywhere",
    subtitle:
      "Use the free web version in any browser, or download the native macOS app for system audio capture.",
    web: {
      name: "Web",
      status: "Available now",
      desc: "Works in Chrome. No download needed.",
      cta: "Open App",
    },
    macos: {
      name: "macOS",
      status: "Coming Q2 2026",
      desc: "Native app. Record Zoom, Teams & system audio.",
      cta: "Get notified",
    },
    ios: {
      name: "iOS",
      status: "Coming Q4 2026",
      desc: "Native iPhone app for on-the-go meetings.",
      cta: "Stay tuned",
    },
  },
  pricing: {
    title: "Simple. Transparent.",
    subtitle: "Choose the plan that works for you. Start free, upgrade anytime.",
    monthly: "Monthly",
    yearly: "Yearly",
    saveMonths: "Save 2 months",
    perMonth: "/mo",
    perYear: "/yr",
    forever: "forever",
    free: {
      name: "Free",
      badge: "Current",
      price: "$0",
      priceYearly: "$0",
      cny: "",
      cnyYearly: "",
      desc: "Everything you need to get started",
      features: [
        "Unlimited real-time transcription",
        "Live translation (10+ languages)",
        "Basic AI meeting analysis",
        "Recording library & export",
        "No account needed",
        "Privacy-first: data stays local",
      ],
      cta: "Start Free",
    },
    plus: {
      name: "Plus",
      badge: "Most Popular",
      price: "$1.99",
      priceYearly: "$19.99",
      cny: "≈ ¥12.99",
      cnyYearly: "≈ ¥129.99",
      desc: "Perfect for daily meetings and classes",
      features: [
        "Everything in Free",
        "High-quality LLM translation (50/day)",
        "AI deep analysis (5/day)",
        "AI meeting summary (2/day)",
        "Great for ~1hr daily meetings",
        "Community support",
      ],
      cta: "Get Plus",
    },
    pro: {
      name: "Pro Max",
      badge: "Best for Power Users",
      price: "$9.99",
      priceYearly: "$99.99",
      cny: "≈ ¥59.99",
      cnyYearly: "≈ ¥599.99",
      desc: "For researchers and professionals",
      features: [
        "Everything in Plus",
        "LLM translation (200/day)",
        "AI deep analysis (60/day)",
        "AI meeting summary (10/day)",
        "Knowledge base (upload papers & docs)",
        "AI-enhanced STT (10hr/mo, Whisper quality)",
        "Zero configuration — we provide everything",
        "Priority support",
      ],
      cta: "Get Pro Max",
    },
    compare: {
      title: "Feature Comparison",
      features: [
        { label: "Real-time transcription", free: "Unlimited", plus: "Unlimited", pro: "Unlimited" },
        { label: "Supported languages", free: "10+", plus: "10+", pro: "10+" },
        { label: "Basic translation", free: true, plus: true, pro: true },
        { label: "LLM high-quality translation", free: false, plus: "50/day", pro: "200/day" },
        { label: "Basic AI analysis", free: true, plus: true, pro: true },
        { label: "AI deep analysis", free: false, plus: "5/day", pro: "60/day" },
        { label: "AI meeting summary", free: false, plus: "2/day", pro: "10/day" },
        { label: "Recording library & export", free: true, plus: true, pro: true },
        { label: "Knowledge base", free: false, plus: false, pro: true },
        { label: "AI-enhanced STT (Whisper)", free: false, plus: false, pro: "10hr/mo" },
        { label: "Priority support", free: false, plus: false, pro: true },
      ],
    },
  },
  builtFor: {
    title: "Built for students who think across borders",
    subtitle:
      "Whether it's a lab meeting in English, a supervisor call in French, or a study group mixing languages — KiwiPenNotes captures everything and makes it searchable, translatable, and actionable.",
    tags: [
      "Lab Meetings",
      "Thesis Defenses",
      "Supervisor Calls",
      "Conferences",
      "Study Groups",
      "Lectures",
      "Research Interviews",
    ],
  },
  cta: {
    title: "Stop missing what matters",
    subtitle:
      "Your next meeting is already complicated enough. Let KiwiPenNotes handle the rest.",
    button: "Try Free Now",
    trustLine: "No sign-up. No credit card. Works in Chrome.",
  },
  footer: {
    brand: "KiwiPenNotes",
    byline: "by Pansheng Intelligence",
    app: "App",
    download: "Download",
    copyright: "© 2026 KiwiPenNotes. All rights reserved.",
  },
  userMenu: {
    upgradePlus: "Upgrade to Plus",
    upgradePro: "Upgrade to Pro Max",
    settings: "Settings",
    manageSubscription: "Manage Subscription",
    signOut: "Sign Out",
    sttRemaining: "STT remaining",
  },
};

const zh: typeof en = {
  nav: {
    features: "功能",
    pricing: "价格",
    download: "下载",
    record: "录制",
    library: "录音库",
    settings: "设置",
    signIn: "登录",
    signUp: "注册",
  },
  hero: {
    badge: "完全免费 — 无需信用卡，无使用限制",
    title1: "听懂每一场会议",
    title2: "跨越每一种语言",
    subtitle:
      "实时语音转录、即时多语翻译、AI 智能分析。为跨语言学习和工作的留学生、研究者量身打造。",
    ctaBrowser: "浏览器免费使用",
    ctaMacOS: "下载 macOS 版",
    trustLine: "无需注册，数据保存在本地浏览器中。",
  },
  demo: {
    title: "KiwiPenNotes — 录制会话",
    transcript: "转录",
    translation: "翻译",
    aiAnalysis: "AI 分析",
    keyInsights: "关键洞察：",
    interim: "统计显著性...",
  },
  features: {
    title: "一切所需，完全免费。",
    subtitle: "专业级会议工具，核心功能完全免费，无隐藏费用，无使用限制。",
    cards: [
      {
        title: "实时语音转录",
        desc: "浏览器原生语音引擎驱动，离线可用，零延迟，完全免费。",
      },
      {
        title: "即时翻译",
        desc: "支持 10+ 种语言，说话的同时翻译在原文旁实时浮现。",
      },
      {
        title: "AI 智能分析",
        desc: "AI 实时识别关键议题、待办事项和重要决定，像有一个智能助手帮你记笔记。",
      },
      {
        title: "会议总结",
        desc: "会议结束后自动生成结构化总结，包含要点、行动项、创新点和待讨论问题。",
      },
      {
        title: "10+ 种语言",
        desc: "支持英语、中文、日语、韩语、法语、德语、西班牙语、葡萄牙语、俄语和阿拉伯语。",
      },
      {
        title: "隐私优先",
        desc: "所有数据保存在浏览器中，无需创建账号，录音本地存储——我们绝不触碰。",
      },
    ],
  },
  howItWorks: {
    title: "30秒开始使用",
    steps: [
      {
        title: "打开即录",
        desc: "点击「开始录制」并允许麦克风权限，就这么简单。网页版无需注册和下载。",
      },
      {
        title: "见证奇迹",
        desc: "左侧实时显示转录文字，右侧同步显示翻译，侧边栏 AI 分析持续运行。",
      },
      {
        title: "获取总结",
        desc: "结束录制后下滑查看完整会议总结，包含要点、行动项和创新点。",
      },
    ],
  },
  platforms: {
    title: "随处可用",
    subtitle: "在任意浏览器使用免费网页版，或下载原生 macOS 应用捕获系统音频。",
    web: {
      name: "网页版",
      status: "现已可用",
      desc: "支持 Chrome 浏览器，无需下载。",
      cta: "打开应用",
    },
    macos: {
      name: "macOS",
      status: "2026年Q2推出",
      desc: "原生应用，录制 Zoom、Teams 及系统音频。",
      cta: "获取通知",
    },
    ios: {
      name: "iOS",
      status: "2026年Q4推出",
      desc: "原生 iPhone 应用，随时随地参会。",
      cta: "敬请期待",
    },
  },
  pricing: {
    title: "简单透明",
    subtitle: "选择适合你的方案，免费开始，随时升级。",
    monthly: "月付",
    yearly: "年付",
    saveMonths: "省2个月",
    perMonth: "/月",
    perYear: "/年",
    forever: "永久免费",
    free: {
      name: "Free",
      badge: "当前方案",
      price: "$0",
      priceYearly: "$0",
      cny: "",
      cnyYearly: "",
      desc: "开始所需的一切",
      features: [
        "无限实时语音转录",
        "即时翻译 (10+ 种语言)",
        "基础 AI 会议分析",
        "录音库和导出",
        "无需注册账号",
        "隐私优先：数据本地存储",
      ],
      cta: "免费开始",
    },
    plus: {
      name: "Plus",
      badge: "最受欢迎",
      price: "$1.99",
      priceYearly: "$19.99",
      cny: "≈ ¥12.99",
      cnyYearly: "≈ ¥129.99",
      desc: "日常会议和课堂的完美选择",
      features: [
        "包含 Free 全部功能",
        "高质量 LLM 翻译 (50次/天)",
        "AI 深度分析 (5次/天)",
        "AI 会议总结 (2次/天)",
        "适合每天约1小时会议",
        "社区支持",
      ],
      cta: "升级 Plus",
    },
    pro: {
      name: "Pro Max",
      badge: "专业之选",
      price: "$9.99",
      priceYearly: "$99.99",
      cny: "≈ ¥59.99",
      cnyYearly: "≈ ¥599.99",
      desc: "为研究者和专业人士设计",
      features: [
        "包含 Plus 全部功能",
        "LLM 翻译 (200次/天)",
        "AI 深度分析 (60次/天)",
        "AI 会议总结 (10次/天)",
        "知识库 (上传论文和文档)",
        "AI 增强语音识别 (10小时/月，Whisper 品质)",
        "零配置——我们提供一切",
        "优先客服支持",
      ],
      cta: "升级 Pro Max",
    },
    compare: {
      title: "功能对比",
      features: [
        { label: "实时语音转录", free: "无限", plus: "无限", pro: "无限" },
        { label: "支持语言", free: "10+", plus: "10+", pro: "10+" },
        { label: "基础翻译", free: true, plus: true, pro: true },
        { label: "LLM 高质量翻译", free: false, plus: "50次/天", pro: "200次/天" },
        { label: "基础 AI 分析", free: true, plus: true, pro: true },
        { label: "AI 深度分析", free: false, plus: "5次/天", pro: "60次/天" },
        { label: "AI 会议总结", free: false, plus: "2次/天", pro: "10次/天" },
        { label: "录音库和导出", free: true, plus: true, pro: true },
        { label: "知识库", free: false, plus: false, pro: true },
        { label: "AI 增强语音识别 (Whisper)", free: false, plus: false, pro: "10小时/月" },
        { label: "优先客服支持", free: false, plus: false, pro: true },
      ],
    },
  },
  builtFor: {
    title: "为跨越国界思考的学生而生",
    subtitle:
      "无论是英语实验室会议、法语导师通话，还是多语言混合的学习小组——KiwiPenNotes 全部捕获，让内容可搜索、可翻译、可执行。",
    tags: [
      "实验室会议",
      "论文答辩",
      "导师通话",
      "学术会议",
      "学习小组",
      "课堂讲座",
      "科研访谈",
    ],
  },
  cta: {
    title: "不再错过重要内容",
    subtitle: "你的下一场会议已经够复杂了，让 KiwiPenNotes 来处理剩下的事。",
    button: "立即免费体验",
    trustLine: "无需注册，无需信用卡，Chrome 即可使用。",
  },
  footer: {
    brand: "KiwiPenNotes",
    byline: "潘盛智能",
    app: "应用",
    download: "下载",
    copyright: "© 2026 KiwiPenNotes. 保留所有权利。",
  },
  userMenu: {
    upgradePlus: "升级至 Plus",
    upgradePro: "升级至 Pro Max",
    settings: "设置",
    manageSubscription: "管理订阅",
    signOut: "退出登录",
    sttRemaining: "剩余语音识别",
  },
};

const translations: Record<Locale, typeof en> = { en, zh };

// ── Context ─────────────────────────────────────────────────

interface LocaleContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: typeof en;
}

const LocaleContext = createContext<LocaleContextType>({
  locale: "en",
  setLocale: () => {},
  t: en,
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  // Read localStorage synchronously to avoid flash of wrong language
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("kpn-locale") as Locale | null;
      if (saved === "en" || saved === "zh") return saved;
    }
    return "en";
  });

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("kpn-locale", l);
    // Update <html lang> attribute
    document.documentElement.lang = l === "zh" ? "zh-CN" : "en";
  };

  const t = translations[locale];

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

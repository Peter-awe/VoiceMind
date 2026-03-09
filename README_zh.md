<div align="center">
  <img src="public/icons/icon-512.png" alt="KiwiPenNotes Logo" width="128" />

  # KiwiPenNotes

  **AI 驱动的实时会议转录、翻译与智能分析**

  [![Website](https://img.shields.io/website?url=https%3A%2F%2Fkiwipennotes.com&label=kiwipennotes.com&style=flat-square)](https://kiwipennotes.com)
  [![Deploy Status](https://img.shields.io/github/actions/workflow/status/Peter-awe/KiwiPenNotes/deploy.yml?label=deploy&style=flat-square&logo=cloudflare)](https://github.com/Peter-awe/KiwiPenNotes/actions)
  [![License](https://img.shields.io/badge/license-BSL--1.1-blue?style=flat-square)](LICENSE)
  [![GitHub stars](https://img.shields.io/github/stars/Peter-awe/KiwiPenNotes?style=flat-square&logo=github)](https://github.com/Peter-awe/KiwiPenNotes/stargazers)
  [![GitHub forks](https://img.shields.io/github/forks/Peter-awe/KiwiPenNotes?style=flat-square&logo=github)](https://github.com/Peter-awe/KiwiPenNotes/network)

  [English](README.md) | **中文**

  [立即体验](https://kiwipennotes.com) · [下载桌面版](https://github.com/Peter-awe/KiwiPenNotes/releases) · [反馈问题](https://github.com/Peter-awe/KiwiPenNotes/issues)

</div>

---

> KiwiPenNotes 是一款**免费、隐私优先**的 AI 会议助手。实时转录、10+ 语言即时翻译、智能分析——全部在浏览器中运行，**无需注册即可使用**。

---

## 核心功能

<table>
<tr>
<td width="50%">

### 实时转录

基于浏览器原生 Web Speech API——离线可用、零延迟、无限使用，无需账号。

</td>
<td width="50%">

### 即时翻译

支持 10+ 语言同步翻译。免费版使用浏览器翻译；Plus/Pro 版使用 LLM 高质量翻译。

</td>
</tr>
<tr>
<td width="50%">

### AI 智能分析

自动实时提取关键议题、待办事项和决策。一键生成结构化会议总结。

</td>
<td width="50%">

### 隐私优先

免费版所有数据留在浏览器本地——我们绝不访问你的录音。无追踪、无数据采集。

</td>
</tr>
<tr>
<td width="50%">

### 知识库 (Pro)

上传论文、课件和文档。AI 在会议中交叉参考你的资料，提供更深入的洞察。

</td>
<td width="50%">

### 30秒上手

点击、允许麦克风、开始录制。就这么简单。无需配置、下载或信用卡。

</td>
</tr>
</table>

---

## 多平台支持

| 平台 | 状态 | 说明 |
|:----:|:----:|:-----|
| **网页版** | 已上线 | Chrome / Edge，无需下载，核心功能免费。 |
| **macOS 桌面版** | 已上线 | 原生 Electron 应用，支持 Apple Silicon 和 Intel。代码在 [`desktop/`](desktop/) 目录。[下载](https://github.com/Peter-awe/KiwiPenNotes/releases) |
| **iOS** | PWA | 通过 Safari「添加到主屏幕」获得原生体验。 |

---

## 支持语言

KiwiPenNotes 支持 **10+ 语言**的转录和翻译：

| 语言 | 代码 | 语言 | 代码 |
|:-----|:-----|:-----|:-----|
| 英语 | `en-US` | 中文 | `zh-CN` |
| 日语 | `ja-JP` | 韩语 | `ko-KR` |
| 法语 | `fr-FR` | 德语 | `de-DE` |
| 西班牙语 | `es-ES` | 葡萄牙语 | `pt-BR` |
| 俄语 | `ru-RU` | 阿拉伯语 | `ar-SA` |

> 界面支持**英文**和**简体中文**，可实时切换。

---

## 价格方案

所有价格为加元（CAD）。免费版核心功能真正无限制——不是试用，没有过期。

| | **Free** | **Plus** | **Pro Max** |
|:---|:---:|:---:|:---:|
| **价格** | $0 | $1.99/月 | $9.99/月 |
| **年付** | — | $19.99/年 | $99.99/年 |
| 实时转录 | 无限 | 无限 | 无限 |
| 即时翻译 | 基础 | LLM x 50次/天 | LLM x 200次/天 |
| AI 分析 | 基础 | 深度 x 5次/天 | 深度 x 60次/天 |
| 会议总结 | — | 2次/天 | 10次/天 |
| 知识库 | — | — | 有 |
| Whisper 语音识别 | — | — | 10小时/月 |
| 技术支持 | 社区 | 社区 | 优先 |

---

## 为什么选择 KiwiPenNotes？

<table>
<tr>
<td>

**真正免费的核心功能** — 不同于竞品把基础功能锁在付费墙后面，我们的转录和基础翻译永久免费。

</td>
</tr>
<tr>
<td>

**本地优先的隐私** — 免费版数据永远不离开你的浏览器。无需账号，无服务端存储。

</td>
</tr>
<tr>
<td>

**为研究者而建** — 专为实验室会议、论文答辩、国际会议和导师沟通设计。

</td>
</tr>
<tr>
<td>

**多模型 AI 支持** — 自带 API Key（Gemini、DeepSeek、Kimi、OpenAI、Claude、Qwen）或使用内置服务。

</td>
</tr>
<tr>
<td>

**10+ 语言** — 支持 10+ 语言实时转录翻译，中英双语界面。

</td>
</tr>
</table>

---

## 技术栈

![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=flat-square&logo=cloudflare&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=flat-square&logo=stripe&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-33-47848F?style=flat-square&logo=electron&logoColor=white)

| 层级 | 技术 |
|:-----|:-----|
| **前端** | Next.js 15, React 18, TailwindCSS, TypeScript |
| **认证与数据库** | Supabase (PostgreSQL + 行级安全) |
| **支付** | Stripe (订阅 + Webhook 管理) |
| **部署** | Cloudflare Workers (通过 OpenNext) |
| **桌面端** | Electron 33 (macOS, Apple Silicon + Intel) |
| **移动端** | Progressive Web App (PWA) |
| **邮件** | Resend (事务性邮件) |
| **CI/CD** | GitHub Actions (推送即自动部署) |

---

## 架构概览

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

## 开发指南

### 前置要求

- **Node.js 20+**（推荐 LTS 版本）
- **npm** 或 **pnpm**
- Supabase 项目（用于认证和数据库）
- Stripe 账号（用于支付，开发阶段可选）

### 安装

```bash
# 1. 克隆仓库
git clone https://github.com/Peter-awe/KiwiPenNotes.git
cd KiwiPenNotes

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入你的 Supabase 和 Stripe 密钥

# 4. 启动开发服务器
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 部署到 Cloudflare Workers

```bash
# 使用 OpenNext 构建
npm run cf:build

# 本地预览
npm run cf:preview

# 部署到生产环境
npm run cf:deploy
```

> CI/CD 已配置——每次推送到 `main` 分支会自动触发 GitHub Actions 部署。

---

## 项目结构

```
KiwiPenNotes/
├── app/                       # Next.js App Router 页面
│   ├── [locale]/              # i18n 路由 (en / zh)
│   │   ├── page.tsx           # 首页
│   │   ├── app/               # 主应用界面
│   │   ├── pricing/           # 价格页
│   │   ├── download/          # 下载页
│   │   └── account/           # 账户管理
│   └── api/                   # API 路由
│       ├── stripe/            # Stripe Webhooks 和结账
│       └── llm/               # Pro 用户 LLM 代理
├── components/                # React 组件
├── lib/                       # 工具函数和配置
├── public/
│   ├── icons/                 # 应用图标 (favicon, PWA, Apple Touch)
│   ├── manifest.json          # PWA 配置
│   └── sw.js                  # Service Worker
├── desktop/                   # Electron 桌面应用 (macOS)
│   ├── main.js                # Electron 主进程
│   ├── preload.js             # 预加载脚本
│   ├── package.json           # 桌面端依赖
│   ├── electron-builder.yml   # 构建配置
│   └── build/                 # 图标和权限文件
├── .github/workflows/
│   ├── deploy.yml             # CI/CD: GitHub Actions -> Cloudflare
│   └── build-desktop.yml      # CI/CD: 构建 macOS DMG
├── wrangler.jsonc             # Cloudflare Workers 配置
├── next.config.mjs            # Next.js 配置
├── tailwind.config.ts         # Tailwind CSS 配置
├── LICENSE                    # BSL-1.1 许可证
├── README.md                  # 英文文档
└── README_zh.md               # 中文文档
```

---

## 路线图

- [x] 实时转录 (Web Speech API)
- [x] 即时翻译 (10+ 语言)
- [x] AI 分析与会议总结
- [x] 多模型 LLM 支持 (6 个提供商)
- [x] Stripe 订阅 (Free / Plus / Pro Max)
- [x] iOS PWA
- [x] macOS 桌面应用 (Electron)
- [x] 深色模式
- [x] 中英双语界面
- [ ] Windows 桌面应用
- [ ] 系统音频采集 (macOS)
- [ ] 协作会议室
- [ ] 会议录音回放
- [ ] 微信支付 / 支付宝集成

---

## 许可证

本项目采用 **Business Source License 1.1 (BSL-1.1)** 许可证。

- **个人、教育和非商业用途**：免费使用，无限制
- **商业用途**：需获取商业许可——[联系我们](https://github.com/Peter-awe)
- **转换日期**：2030年3月1日后自动转为 **MIT 许可证**

详见 [LICENSE](LICENSE)。

---

## 致谢

KiwiPenNotes 为国际研究社区而建。

特别感谢：

- [Supabase](https://supabase.com) — 认证与数据库
- [Cloudflare Workers](https://workers.cloudflare.com) — 边缘部署
- [Stripe](https://stripe.com) — 支付基础设施
- [OpenNext](https://opennext.js.org) — 在 Cloudflare 上运行 Next.js
- 开源社区

---

## 联系方式

<div align="center">

**由 [潘琪伟 (Qiwei Pan)](https://github.com/Peter-awe) 开发** · 蒙特利尔，加拿大

[![Website](https://img.shields.io/badge/官网-kiwipennotes.com-45B7AA?style=for-the-badge&logo=google-chrome&logoColor=white)](https://kiwipennotes.com)
[![GitHub](https://img.shields.io/badge/GitHub-Peter--awe-181717?style=for-the-badge&logo=github)](https://github.com/Peter-awe)

---

如果 KiwiPenNotes 对你有帮助，请给个 Star！

</div>

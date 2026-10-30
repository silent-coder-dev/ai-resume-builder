<div align="center">

# AI Resume Studio

### Build a resume that gets you noticed — free, no sign-up

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-Vitest_+_Playwright-6E9F18?style=for-the-badge)](#-testing)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<p align="center">
  <b>AI should improve your story, never invent your achievements.</b>
</p>

### 🌐 [Live website: ai-resume-builder-silent.vercel.app](https://ai-resume-builder-silent.vercel.app)

[Documentation](#-documentation) • [Features](#-features) • [Your data](#-your-data-is-safe) • [Getting Started](#-getting-started) • [Testing](#-testing) • [Project Structure](#-project-structure)

</div>

---

## 🌟 What is AI Resume Studio?

AI Resume Studio is a free resume builder that runs in your browser. Open it and start — there is no account, no paywall, and no watermark.

You can keep **several resumes** (for example a Java Developer resume and an Internship resume). Every change is **saved automatically** in your browser. AI helps you write, check, and tailor your resume, but **every AI suggestion waits for your approval**, and the AI never adds skills, numbers, or experience you did not give it.

The full product plan is in the [Product Requirements Document](./doc/PRD.md).

---

## 📚 Documentation

All documents are in the [`doc/`](./doc) folder, written in simple English.

| # | Document | What you will learn |
|---|---|---|
| 1 | [Problem and Solution](./doc/01-PROBLEM-AND-SOLUTION.md) | The problem, what the website does, and who it is for |
| 2 | [Approaches](./doc/02-APPROACHES.md) | How everything is built, and why |
| 3 | [Design System](./doc/03-DESIGN-SYSTEM.md) | Fonts, colors, spacing, components, motion, and templates |
| 4 | [Flowcharts](./doc/04-FLOWCHARTS.md) | Diagrams of every flow: saving, new resume, AI approval, tools |
| 5 | [Directory Map](./doc/05-DIRECTORY-MAP.md) | Every folder and file, with a "where do I change…" finder |
| 📋 | [Product Requirements (PRD)](./doc/PRD.md) | The full product plan (v2.0) |

---

## ✨ Features

| Area | What you get |
|---|---|
| **Resume Builder** | Section-by-section editor with a live A4 preview, undo/redo, and autosave. Sections: Personal Information, Summary, Education, Work Experience, Internships, Projects, Skills, Certifications, Achievements, Languages, and your own custom sections. Reorder or hide any section. |
| **My Resumes** | Keep many independent resumes. Open, rename, duplicate, download, export, or delete each one. |
| **Start your way** | Blank resume, import your old PDF, start from one of 10 example resumes, or copy one of your own. |
| **Fresher mode** | Students and freshers get Education and Projects first, and are never marked down for having no job history. |
| **AI writing assistant** | Improve Writing, Make Concise, Make Professional, Fix Grammar, Improve Clarity, Rewrite as Achievement, Add Relevant Keywords — always shown next to your original for Accept / Edit / Reject. |
| **Resume Analyzer** | Analyze a saved resume **or upload a PDF**. An explainable readiness score with issues, severity, why it matters, how to fix it, and a "Fix" button. Optional AI review for grammar, clarity, and role relevance. |
| **Job Matcher** | Compare a saved or uploaded resume with a job description (paste it, or upload a PDF or .txt): evidence for each requirement, missing skills, keyword gaps, and project alignment. Create a **separate tailored version** — the original is never changed. |
| **GitHub Projects** | Turn public repositories into project entries written only from the README, languages, and topics. |
| **Interview Prep** | Use a saved or uploaded resume, and optionally a job description. Questions test the **job's requirements** and show which ones your resume covers. **Coding questions come with sample code**, hidden until you ask, plus feedback on your answer. |
| **Templates & PDF** | 11 ATS-friendly A4 templates, 7 accent colors, and a clean PDF with real text, clickable links, and correct margins on every page. |

---

## 🛡️ Your data is safe

- **Saved automatically** in this browser (IndexedDB) as you type, with a visible status: *Saving…*, *All changes saved*, *Offline*, *Save failed*, or *Recovering previous changes*.
- **Refresh or Back never loses work.** The last resume reopens exactly where you left it. If the tab closes in the middle of a save, the change is recovered on your next visit.
- **Nothing is overwritten silently.** Creating a new resume asks: *Continue existing resume*, *Create new resume*, or *Cancel*. Edits from two tabs never overwrite each other without asking.
- **Version history** lets you restore an earlier version of any resume.
- **Backups:** export one or all resumes as a `.json` file and import them on any browser.
- **Privacy:** no account and no database. Your text goes to the AI provider only when you use an AI feature. See [Privacy & Data](https://ai-resume-builder-silent.vercel.app/privacy).

---

## 🛠️ Tech Stack

| Area | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS 4 with design tokens, Inter font, Lucide icons |
| State | Zustand 5 (workspace store) |
| Storage | IndexedDB through a storage service (`src/lib/storage`) |
| AI | Google Gemini (default) or OpenRouter, called only from the server |
| GitHub | GitHub REST API (public repositories only) |
| PDF | Browser print engine with A4 rules |
| Tests | Vitest + fake-indexeddb (unit), Playwright (end-to-end) |
| Hosting | Vercel |

---

## 🚀 Getting Started

### 1. Clone and install

```bash
git clone https://github.com/silent-coder-dev/ai-resume-builder.git
cd ai-resume-builder
npm install
```

### 2. Add environment variables

Create `.env.local` in the project root.

```env
# Choose one AI provider
AI_PROVIDER=gemini                     # or: openrouter
GEMINI_API_KEY=your-google-gemini-key
# OPENROUTER_API_KEY=your-openrouter-key
# OPENROUTER_MODEL=google/gemini-2.5-flash

# Recommended
AI_SYNC_TOKEN_SECRET=any-long-random-text

# Optional: a different OpenRouter model per tool, to spread the load
# OPENROUTER_MODEL_ANALYZER=cohere/north-mini-code:free
# OPENROUTER_MODEL_JOB_MATCH=nvidia/nemotron-3-ultra-550b-a55b:free
# OPENROUTER_MODEL_INTERVIEW=another/model:free

# Optional
# AI_RATE_LIMIT_PER_MINUTE=10
# AI_RATE_LIMIT_PER_DAY=150
# GITHUB_TOKEN=a-github-token-for-higher-api-limits
```

| Variable | Required? | What it does |
|---|---|---|
| `AI_PROVIDER` | No (default `gemini`) | `gemini` or `openrouter` |
| `GEMINI_API_KEY` | For Gemini | Google AI Studio key |
| `OPENROUTER_API_KEY` | For OpenRouter | OpenRouter key |
| `OPENROUTER_MODEL` / `OPENROUTER_FALLBACK_MODELS` | No | OpenRouter main and backup models |
| `OPENROUTER_MODEL_ANALYZER` / `OPENROUTER_MODEL_JOB_MATCH` / `OPENROUTER_MODEL_INTERVIEW` | No | A separate OpenRouter model for the Resume Analyzer's AI review, the Job Matcher, and Interview Prep. If that model fails or gives an unusable answer, the main model answers instead. |
| `AI_SYNC_TOKEN_SECRET` | Recommended | Signs the job-tailoring permission token |
| `AI_RATE_LIMIT_PER_MINUTE` / `AI_RATE_LIMIT_PER_DAY` | No | Fair-use AI limits per visitor (defaults 10 and 150) |
| `GITHUB_TOKEN` | No | Raises GitHub API limits for the GitHub Projects tool |
| `NEXT_PUBLIC_SITE_URL` | No | Your site URL, sent to OpenRouter as the referrer |

Keep `.env.local` private. On Vercel, add the same variables in **Project Settings → Environment Variables** and redeploy.

### 3. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright; run `npm run build` first) |

---

## 🧪 Testing

- **Unit tests** (`tests/unit`, 33 tests): the storage service, autosave, undo/redo, conflicts between tabs, version history, backups, recovery of unsaved edits, the analyzer, data cleanup, and rate limits.
- **End-to-end tests** (`tests/e2e`, 18 tests): every data-safety scenario in the PRD (refresh, Back, new-resume dialog, continue, create, cancel, duplicate, delete, cleared storage), AI approval, templates and PDF, keyboard use, phone layouts, and the upload flows in the Analyzer, Job Matcher, and Interview Prep. AI calls are mocked, so the tests are free and repeatable.

On Windows the end-to-end tests use the installed Microsoft Edge. Elsewhere, run `npx playwright install chromium` once.

---

## 📂 Project Structure

```text
src/
├── app/
│   ├── page.tsx                 # Home page
│   ├── (studio)/                # App pages sharing the sidebar
│   │   ├── builder/             # Resume Builder (workspace)
│   │   ├── resumes/             # My Resumes
│   │   ├── analyzer/            # Resume Analyzer
│   │   ├── job-match/           # Job Matcher
│   │   ├── github/              # GitHub Projects
│   │   ├── interview/           # Interview Prep
│   │   ├── settings/            # Settings
│   │   └── privacy/             # Privacy & Data
│   └── api/
│       ├── ai/route.ts          # All AI actions (server only)
│       └── github/route.ts      # Public GitHub repository data
├── components/
│   ├── home/                    # Home page sections
│   ├── shell/                   # Sidebar, banners, autosave lifecycle
│   ├── workspace/               # Builder: toolbar, sections, editors, AI tools
│   ├── tools/                   # Analyzer, matcher, GitHub, interview, resumes, settings, privacy
│   ├── preview/                 # 11 resume templates and the A4 preview
│   └── ui/                      # Buttons, fields, dialogs, menus, toasts
├── lib/
│   ├── storage/                 # IndexedDB storage service, backups, recovery
│   ├── resume/                  # Resume record, sections, analyzer, validation, samples
│   ├── server/rateLimit.ts      # AI and GitHub rate limits
│   └── entitlements.ts          # Feature policies (all free at launch)
├── store/                       # Workspace store and preferences
├── types/                       # Resume types and example resumes
└── utils/                       # AI client, PDF export, data cleanup, helpers
tests/
├── unit/                        # Vitest
└── e2e/                         # Playwright
```

The full map is in [Directory Map](./doc/05-DIRECTORY-MAP.md).

---

## 📜 License

Distributed under the MIT License. Made by **silent_coder**.

<div align="center">

# 🚀 AI Resume Studio

### Build an honest, ATS-friendly resume — free, in your browser

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/Zustand-State_Management-orange?style=for-the-badge)](https://zustand-demo.pmnd.rs/)
[![Google Gemini](https://img.shields.io/badge/AI_Engine-Gemini_3.8_Flash-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<p align="center">
  <b>Create, polish, and tailor your resume with AI that improves the wording — and never invents the facts.</b>
</p>

### 🌐 [Live website: ai-resume-builder-silent.vercel.app](https://ai-resume-builder-silent.vercel.app)

[Live Demo](https://ai-resume-builder-silent.vercel.app) • [Documentation](#-documentation) • [Features](#-key-features) • [Templates](#-11-ats-friendly-templates) • [Getting Started](#-getting-started) • [Project Structure](#-project-structure)

</div>

---

## 🌟 What is AI Resume Studio?

AI Resume Studio is a free resume builder that runs in your browser. You can start from a blank page, import your old PDF resume, or load a sample. You then edit in 7 simple steps while a live A4 preview updates as you type. When you are happy, you download a clean PDF.

AI helps you write a professional summary, turn rough notes into strong bullet points, fix grammar, and compare your resume with a real job description. **One rule is always followed: the AI can improve how something is said, but it never adds skills, numbers, jobs, or results you did not give it.**

- ✅ **Free** — no payment, no watermark
- ✅ **No account** — your draft is saved only in your own browser
- ✅ **Works on mobile** — edit and preview on a phone

---

## 📚 Documentation

All project documents live in the [`doc/`](./doc) folder and are written in simple English.

| # | Document | What you will learn |
|---|---|---|
| 1 | [Problem and Solution](./doc/01-PROBLEM-AND-SOLUTION.md) | The problem, what the website does, how it solves it, and who it is for |
| 2 | [Approaches](./doc/02-APPROACHES.md) | Every technical approach in detail, and why it was chosen |
| 3 | [Design System](./doc/03-DESIGN-SYSTEM.md) | Fonts, colors, components, animation, and all 11 templates |
| 4 | [Flowcharts](./doc/04-FLOWCHARTS.md) | Diagrams of every feature, from import to PDF download |
| 5 | [Directory Map](./doc/05-DIRECTORY-MAP.md) | Every folder and file, with a visual map and a "where do I change…" finder |

---

## ✨ Key Features

### ✍️ Guided editor
- **7 small steps:** Personal → Skills → Experience → Projects → Education → Certifications → Achievements.
- **Live A4 preview** that updates as you type, with red dashed lines where each page ends.
- **Clickable profile links** for GitHub, LinkedIn, LeetCode, portfolio, or any site.
- **Complete education records:** Class 10, Class 12, diploma, degree, and postgraduate entries, each with its own year and marks.
- **"I currently work here"** option that shows *Present* on the resume.
- **Your draft is saved automatically** in this browser and restored when you come back.

### 🤖 AI helpers (evidence only)
- **PDF import:** the AI reads your PDF and fills the matching fields. Missing sections stay empty — nothing is guessed.
- **AI Summary Studio:** asks if you are a fresher or experienced, then writes a 3-sentence summary from your real details.
- **AI Enhance:** turns rough work notes into 2–3 clear bullet points. You can edit them line by line.
- **Optimize with AI:** polishes grammar and clarity across the resume. You see every change side by side and choose to apply or keep the original.

### 🎯 Honest job matching
- Paste or upload (.txt / .md) a full job description and compare it with your resume.
- See each requirement with the **evidence found** or the **gap**, split into *required* and *preferred*.
- Get warnings for **domain mismatch**, **missing license**, or **not enough experience**.
- **"Sync resume with JD"** (tailor your resume to the job) only unlocks when your field, key skills, and experience level truly fit — not because of a percentage. It is protected by a signed, 15-minute server token.

### 🎨 Layout and export
- **11 templates** and **7 accent colors** — try them all live in the home page gallery, then open the editor with one click.
- **Reorder or hide sections** — freshers can put Projects first, experienced people can lead with Work Experience.
- **ATS score out of 100** with clear tips to improve.
- **Clean PDF download** using the browser's own print engine: real text that ATS software can read, no watermark, and no browser URL or date on the page.

---

## 📄 11 ATS-Friendly Templates

| | Template | Best for |
|---|---|---|
| 0 | Blank Canvas | The simplest possible layout |
| 1 | Modern Tech *(default)* | Software, IT, startups |
| 2 | Executive Serif | Managers and senior roles |
| 3 | Creative Sidebar | Designers and portfolios |
| 4 | Compact Grid | Fitting a lot onto one page |
| 5 | Pure Minimal | A clean, quiet look |
| 6 | Corporate Banner | Business, consulting, sales |
| 7 | Career Timeline | Showing a clear career path |
| 8 | Legal / Academic | Law, research, teaching |
| 9 | Bold Designer | Creative and marketing roles |
| 10 | Clinical Healthcare | Doctors, nurses, healthcare |

**10 sample profiles** are included (Java, MERN, law, medicine, teaching, sales, design, finance, HR, and data science) so you can see a full resume before you start.

---

## 🛠️ Tech Stack

| Area | Technology | Purpose |
|---|---|---|
| Framework | Next.js 16 (App Router) | Pages and the server-side AI route |
| Language | TypeScript 5 (strict) | Safe, typed resume data |
| UI | React 19 + Tailwind CSS 4 | Interface and print styles |
| Fonts | Geist Sans and Geist Mono | Interface and resume text |
| State | Zustand 5 + persist | One store, saved in the browser |
| Animation | Framer Motion | Smooth tabs, modals, and transitions |
| Icons | Lucide React | One consistent icon set |
| AI | Google Gemini (default) or OpenRouter | Import, summary, bullets, polish, job matching |
| PDF | Browser print + hidden iframe | Real-text A4 PDF output |
| Hosting | Vercel | Hosting and deployment |

Want the details? Read **[Approaches](./doc/02-APPROACHES.md)**.

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/silent-coder-dev/ai-resume-builder.git
cd ai-resume-builder
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add your environment variables

Create a file named `.env.local` in the project root.

**Option A — Google Gemini (default):**

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your-google-gemini-api-key
AI_SYNC_TOKEN_SECRET=any-long-random-text
```

**Option B — OpenRouter:**

```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=google/gemini-2.5-flash
# Optional, comma separated:
# OPENROUTER_FALLBACK_MODELS=provider/backup-model
AI_SYNC_TOKEN_SECRET=any-long-random-text
```

| Variable | Required? | What it does |
|---|---|---|
| `AI_PROVIDER` | No (default `gemini`) | `gemini` or `openrouter` |
| `GEMINI_API_KEY` | Yes, for Gemini | Your Google AI Studio key |
| `OPENROUTER_API_KEY` | Yes, for OpenRouter | Your OpenRouter key |
| `OPENROUTER_MODEL` | No | Main OpenRouter model (default `google/gemini-2.5-flash`) |
| `OPENROUTER_FALLBACK_MODELS` | No | Backup OpenRouter models, comma separated |
| `AI_SYNC_TOKEN_SECRET` | Recommended | Secret used to sign the job-tailoring token. If empty, the AI key is used. |
| `NEXT_PUBLIC_SITE_URL` | No | Your site URL, sent to OpenRouter as the referrer |

Pick a model from [OpenRouter's model list](https://openrouter.ai/models). Keep `.env.local` private and never commit it. On Vercel, add the same variables under **Project Settings → Environment Variables**, then redeploy.

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The home page is at `/` and the editor is at `/builder`.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production build |
| `npm run lint` | Check the code with ESLint |

---

## 📂 Project Structure

```text
ai-resume-builder/
├── doc/                             # Project documentation (5 guides)
├── public/                          # Static files
└── src/
    ├── app/
    │   ├── api/ai/route.ts          # The AI server route (all AI actions)
    │   ├── builder/
    │   │   ├── layout.tsx           # Editor page title
    │   │   └── page.tsx             # Editor: toolbar, form, live preview
    │   ├── globals.css              # Tailwind, fonts, A4 print rules
    │   ├── icon.tsx                 # Favicon
    │   ├── layout.tsx               # Root layout and fonts
    │   └── page.tsx                 # Home page
    ├── components/
    │   ├── home/                    # Home page, one file per section
    │   │   ├── StudioLanding.tsx    # Puts the sections in order
    │   │   ├── LandingNav.tsx       # Floating glass navigation
    │   │   ├── LandingHero.tsx      # Hero, start / import, 3D live resume
    │   │   ├── LandingFeatures.tsx  # Stats, feature bento, steps, honesty section
    │   │   ├── TemplateShowcase.tsx # Live gallery of all 11 templates
    │   │   ├── JobMatchSection.tsx  # Job match + tailoring
    │   │   ├── LandingFaq.tsx       # FAQ
    │   │   ├── LandingFooter.tsx    # Footer
    │   │   ├── landingPrimitives.tsx # Reveal, CountUp, ScoreRing, ScaledResume …
    │   │   └── landingDemoResume.ts # Made-up demo profile for previews
    │   ├── layout/Footer.tsx        # Editor footer
    │   ├── preview/
    │   │   ├── AllTemplates.tsx     # 11 templates + shared section engine
    │   │   ├── templateCatalog.tsx  # One list of templates + accent colors
    │   │   └── ResumeCanvasContainer.tsx  # A4 canvas, zoom, page counter
    │   ├── ui/AtsScoreMeter.tsx     # ATS score gauge and tips
    │   └── wizard/
    │       ├── FormWizard.tsx       # 7-step form, AI summary, AI bullets
    │       ├── ResumeOptimizeButton.tsx  # AI polish with side-by-side review
    │       ├── SectionReorderModal.tsx   # Reorder and show/hide sections
    │       └── UploadResumeModal.tsx     # Import a PDF inside the editor
    ├── store/
    │   ├── useResumeStore.ts        # The one data store (saved in the browser)
    │   └── useStoreHydrated.ts      # "Is the saved draft loaded yet?"
    ├── types/
    │   ├── initialResumeData.ts     # Empty resume + 10 sample profiles
    │   └── resume.ts                # Resume data types
    └── utils/
        ├── aiClient.ts              # Calls /api/ai with friendly errors
        ├── atsScore.ts              # ATS score and tips
        ├── exportPdf.ts             # Print frame for PDF download
        ├── normalizeResumeData.ts   # Cleans AI resume data
        ├── resumeContent.ts         # "Is it filled?" checks and IDs
        └── resumeImport.ts          # PDF checks and import
```

See the full map with diagrams in **[Directory Map](./doc/05-DIRECTORY-MAP.md)**.

---

## 🔒 Privacy

- Your resume is saved **only in your browser** (localStorage). There is no database and no login.
- Your details are sent to the AI provider **only when you press an AI button**, and only what that feature needs.
- AI suggestions can be imperfect. Always review your resume before you send it.

---

## 📜 License

Distributed under the MIT License. Made by **silent_coder**.

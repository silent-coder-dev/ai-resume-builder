<div align="center">

# 🚀 AI Resume Studio

### A thoughtful workspace for professional, evidence-based resumes

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/Zustand-State_Management-orange?style=for-the-badge)](https://zustand-demo.pmnd.rs/)
[![Google Gemini](https://img.shields.io/badge/AI_Engine-Gemini_3.8_Flash-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<p align="center">
  <b>Create, refine, and tailor a resume while keeping every detail grounded in your real experience.</b>
</p>

### 🌐 [Live Application: ai-resume-builder-silent.vercel.app](https://ai-resume-builder-silent.vercel.app)

[Live Demo](https://ai-resume-builder-silent.vercel.app) • [Key Features](#-key-features) • [Dynamic Reordering](#-what-we-built-dynamic-section-reordering) • [PDF Sandbox](#-pdf-export-architecture-isolated-iframe-sandboxing) • [Tech Stack](#-tech-stack--libraries) • [Getting Started](#-getting-started)

</div>

---

## 🌟 Overview

**AI Resume Studio** helps candidates create polished, ATS-aware resumes with guided editing, PDF import, AI proofreading, and job-description analysis.

Check out the live production deployment here: **[https://ai-resume-builder-silent.vercel.app](https://ai-resume-builder-silent.vercel.app)**.

Powered by **Google Gemini or OpenRouter**, it extracts resume information from PDFs, offers evidence-led feedback against job descriptions, and helps improve resume wording without inventing qualifications or metrics.

---

## 🔀 What We Built: Dynamic Section Reordering

To support both **early-career applicants** (who may prioritize *Projects* and *Education*) and **experienced professionals** (who may prioritize *Work Experience*), the editor includes a modular layout engine:

* **Modular Priority Sequencing**: Freely reorder all core resume sections (`summary`, `skills`, `experience`, `projects`, `education`, `certifications`, `achievements`) via intuitive controls.
* **Per-Section Visibility Controls**: Toggle individual sections on or off with an eye icon. Hidden or empty sections collapse cleanly without leaving visual gaps, empty headings, or broken borders.
* **Anchored ATS Contact Header**: Personal details, locations, and social/coding platform handles remain fixed at the top for strict applicant tracking compliance.
* **Persistent State Hydration**: Selected section ordering and visibility states persist across browser reloads, template switches, and profile changes via Zustand storage middleware.
* **Universal Multi-Template Support**: Every built-in layout dynamically consumes the active section order with strict `break-inside-avoid` CSS rules to avoid awkward page breaks.

---

## 🖨️ PDF Export Architecture: Isolated Iframe Sandboxing

Resume export uses a dedicated print canvas and print-specific styles to create a clean A4 document while keeping interactive editor controls out of the output.

The export flow prepares the document in an isolated frame:

1. **DOM Cloning**: The target `#printable-resume-canvas` element is cloned using `.cloneNode(true)`.
2. **Transform Stripping**: Dynamic zoom CSS (`transform: scale(...)`), view controls, and interactive editor margins are stripped from the clone.
3. **Iframe Sandboxing**: A hidden, sandbox-isolated `<iframe>` is generated dynamically, and the clean HTML tree along with application stylesheets is injected directly into it.
4. **Zero-Margin Vector Output**: Strict `@page { size: A4 portrait; margin: 0; }` styling is enforced, ensuring clean vector typography without browser timestamp headers or unwanted URL footers.

---

## 🛠️ Tech Stack & Libraries

<table>
  <thead>
    <tr>
      <th align="left">Domain</th>
      <th align="left">Technology</th>
      <th align="left">Purpose</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><strong>Deployment</strong></td><td>Vercel</td><td>Application hosting and continuous deployment</td></tr>
    <tr><td><strong>Framework</strong></td><td>Next.js 16 · App Router</td><td>Pages, layouts, and server-side AI API routes</td></tr>
    <tr><td><strong>Language</strong></td><td>TypeScript 5</td><td>Typed resume data and application logic</td></tr>
    <tr><td><strong>State</strong></td><td>Zustand 5 · Persist</td><td>Resume data and editor preferences saved in the browser</td></tr>
    <tr><td><strong>Styling</strong></td><td>Tailwind CSS 4</td><td>Responsive application UI and print styles</td></tr>
    <tr><td><strong>Animation</strong></td><td>Framer Motion</td><td>Page, control, and modal transitions</td></tr>
    <tr><td><strong>Icons</strong></td><td>Lucide React</td><td>Consistent interface iconography</td></tr>
    <tr><td><strong>AI providers</strong></td><td>Google Gemini or OpenRouter</td><td>Resume parsing, proofreading, summaries, and job-fit analysis</td></tr>
    <tr><td><strong>PDF export</strong></td><td>Print-isolated resume canvas</td><td>A4 resume output with dedicated print styling</td></tr>
  </tbody>
</table>

---

## ✨ Key Features

### 🤖 AI Resume Toolkit
* **Evidence-only PDF Resume Extraction**: Import a PDF from the homepage and map only information present in the file to resume fields; absent sections such as work experience stay empty instead of being guessed.
* **Complete Education Records**: Keep secondary/Class 10, senior secondary/Class 12, diploma, undergraduate, and postgraduate qualifications as separate entries with institution, exact qualification, specialization/stream, passing year, and marks/CGPA when available. Missing details stay blank and can be added manually.
* **Truthful Resume Optimization**: Review all suggested narrative edits for grammar, clarity, and consistency before applying them; factual fields, skills, dates, and education stay unchanged.
* **Evidence-based Job Matcher**: Compares documented resume evidence against job requirements, separates required from preferred gaps, and reports seniority/domain concerns. JD tailoring eligibility is based on role/domain fit, relevant skills, experience level, and critical requirements—not the match percentage. A short-lived server-signed authorization is bound to the analyzed resume and job description.
* **Privacy-conscious draft workflow**: Continue a browser-saved draft or begin a new resume from scratch or a PDF import.
* **Experience Bullet Enhancer**: Rewrites candidate-provided notes into concise action bullets without fabricating metrics or outcomes.
* **Executive Summary Generator**: Produces professional, role-focused summaries from the candidate's supplied details.

### 🧭 Sliding Navigation Wizard & Profile Links
* **Sliding Navigation Bar**: Framer Motion tab slider with scroll arrows and step indicators.
* **Clickable Online Profiles**: Add direct, clickable links for **GitHub**, **LinkedIn**, **LeetCode**, **Codeforces**, **Portfolio**, or custom platforms.

### 📄 11 ATS-Aware Print Templates
* `Modern Tech`
* `Executive Serif`
* `Creative Sidebar`
* `Compact Grid`
* `Pure Minimal`
* `Corporate Banner`
* `Career Timeline`
* `Legal / Academic`
* `Bold Designer`
* `Clinical Healthcare`
* `Blank Canvas`

### 🎯 Pre-Loaded Industry Profiles
* Example profiles for Java backend, MERN stack, legal, healthcare, data science, education, UI/UX, sales, and finance.

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/silent-coder-dev/ai-resume-studio.git
cd ai-resume-studio
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
Create or update `.env.local` in your project root. To use OpenRouter, add:

```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=google/gemini-2.5-flash
# Optional comma-separated OpenRouter model fallbacks:
# OPENROUTER_FALLBACK_MODELS=provider/backup-model
```

Choose a supported model from [OpenRouter's model catalog](https://openrouter.ai/models). Alternatively, use Gemini with `AI_PROVIDER=gemini` and `GEMINI_API_KEY=your-google-gemini-api-key`. Keep `.env.local` private and never commit API keys. For Vercel, add the same variables under **Project Settings → Environment Variables**, select the required environments, and redeploy.

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The homepage provides the resume workflow; the editor is available at `/builder`.

### 📂 Project Structure
```text
src/
├── app/
│   ├── api/ai/route.ts              # AI providers and resume/JD actions
│   ├── builder/page.tsx             # Resume editor and live preview
│   ├── globals.css                  # Print media queries (@page A4) & base styles
│   ├── layout.tsx                   # Root HTML shell & metadata
│   └── page.tsx                     # Product homepage
├── components/
│   ├── home/                        # Landing page and homepage footer
│   ├── layout/Footer.tsx            # Editor footer
│   ├── preview/
│   │   ├── AllTemplates.tsx         # 11 reorder-compliant resume templates
│   │   └── ResumeCanvasContainer.tsx # Responsive resume preview canvas
│   ├── ui/
│   │   └── AtsScoreMeter.tsx        # Dynamic circular ATS score gauge
│   └── wizard/
│       ├── FormWizard.tsx           # Multi-step editor with slider tabs & links
│       ├── JobMatcherModal.tsx      # Semantic JD matcher & gap analysis
│       ├── ResumeOptimizeButton.tsx # Reviewable AI proofreading workflow
│       ├── SectionReorderModal.tsx  # Dynamic section reorder & visibility modal
│       └── UploadResumeModal.tsx    # Native Base64 PDF parsing modal
├── store/
│   └── useResumeStore.ts            # Zustand store managing resume data & section order
├── types/
│   ├── initialResumeData.ts         # Sample profile datasets for 10 industries
│   └── resume.ts                    # Core TypeScript interfaces
└── utils/
    ├── atsScore.ts                  # ATS heuristics calculation logic
    ├── exportPdf.ts                 # Isolated hidden iframe PDF export
    └── normalizeResumeData.ts       # Validation and mapping of extracted resume data
```

### 📜 License
Distributed under the MIT License. Engineered by silent_coder
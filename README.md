<div align="center">

# 🚀 AI Resume Studio

### Intelligent ATS Optimization & Precision Vector PDF Engineering Engine

[![Next.js](https://img.shields.io/badge/Next.js-15.0+-black?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/Zustand-State_Management-orange?style=for-the-badge)](https://zustand-demo.pmnd.rs/)
[![Google Gemini](https://img.shields.io/badge/AI_Engine-Gemini_3.8_Flash-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<p align="center">
  <b>Built for vector-grade PDF generation, zero Chromium Mojo print crashes, and full drag-and-drop structural section control.</b>
</p>

### 🌐 [Live Application: ai-resume-builder-silent.vercel.app](https://ai-resume-builder-silent.vercel.app)

[Live Demo](https://ai-resume-builder-silent.vercel.app) • [Key Features](#-key-features) • [Dynamic Reordering](#-what-we-built-dynamic-section-reordering) • [PDF Sandbox](#-pdf-export-architecture-isolated-iframe-sandboxing) • [Tech Stack](#-tech-stack--libraries) • [Getting Started](#-getting-started)

</div>

---

## 🌟 Overview

**AI Resume Studio** is an enterprise-grade resume builder engineered to resolve standard industry flaws: distorted PDF downloads, browser print engine crashes (Chromium/Brave Mojo IPC errors), and rigid section hierarchies.

Check out the live production deployment here: **[https://ai-resume-builder-silent.vercel.app](https://ai-resume-builder-silent.vercel.app)**.

Powered by **Google Gemini 3.8-Flash**, it delivers native multi-modal PDF parsing, actionable gap analysis against job descriptions, Google X-Y-Z formula bullet point generation, and dynamic drag-and-drop section reordering[cite: 1].

---

## 🔀 What We Built: Dynamic Section Reordering

To support both **Early-Career Applicants** (who need *Projects* and *Education* upfront) and **Senior Engineers** (who prioritize *Work Experience*), we built a modular layout engine:

* **Modular Priority Sequencing**: Freely reorder all core resume sections (`summary`, `skills`, `experience`, `projects`, `education`, `certifications`, `achievements`) via intuitive controls.
* **Per-Section Visibility Controls**: Toggle individual sections on or off with an eye icon. Hidden or empty sections collapse cleanly without leaving visual gaps, empty headings, or broken borders.
* **Anchored ATS Contact Header**: Personal details, locations, and social/coding platform handles remain fixed at the top for strict applicant tracking compliance.
* **Persistent State Hydration**: Selected section ordering and visibility states persist across browser reloads, template switches, and profile changes via Zustand storage middleware.
* **Universal Multi-Template Support**: Every built-in layout dynamically consumes the active section order with strict `break-inside-avoid` CSS rules to avoid awkward page breaks.

---

## 🖨️ PDF Export Architecture: Isolated Iframe Sandboxing

Standard browser-based printing (`window.print()`) frequently triggers Chromium Mojo IPC crashes and blank page anomalies, particularly in browsers with built-in AI extensions or strict ad-blockers (e.g., Brave Leo AI). 

We solved this using an **Isolated Sandboxing Engine**:

1. **DOM Cloning**: The target `#printable-resume-canvas` element is cloned using `.cloneNode(true)`.
2. **Transform Stripping**: Dynamic zoom CSS (`transform: scale(...)`), view controls, and interactive editor margins are stripped from the clone.
3. **Iframe Sandboxing**: A hidden, sandbox-isolated `<iframe>` is generated dynamically, and the clean HTML tree along with application stylesheets is injected directly into it.
4. **Zero-Margin Vector Output**: Strict `@page { size: A4 portrait; margin: 0; }` styling is enforced, ensuring clean vector typography without browser timestamp headers or unwanted URL footers.

---

## 🛠️ Tech Stack & Libraries

| Domain | Technology | Core Purpose |
| :--- | :--- | :--- |
| **Deployment** | **Vercel** | Global edge production hosting and continuous deployment |
| **Framework** | **Next.js 15+ (App Router)**[cite: 1] | Server & Client Components, API Handlers, and Route Optimization |
| **Language** | **TypeScript 5+**[cite: 1] | Full static type definitions across resume schemas and wizard payloads |
| **State Store** | **Zustand (`persist`)**[cite: 1] | Reactive global state handling resume content, active themes, and reorder states |
| **Styling** | **Tailwind CSS**[cite: 1] | Responsive utility layout styling and `@media print` rules |
| **Animations** | **Framer Motion**[cite: 1] | Wizard step pill carousel animation (`layoutId`) and modal transitions |
| **Icons** | **Lucide React**[cite: 1] | Lightweight, tree-shakeable UI iconography |
| **AI Engine** | **Google GenAI (`gemini-3.8-flash`)**[cite: 1] | Multi-modal document parsing, Google X-Y-Z bullets, and semantic ATS screening |
| **Print Sandbox** | **Isolated DOM Iframe** | Vector-grade A4 PDF export bypassing Chromium extension errors |

---

## ✨ Key Features

### 🤖 Google Gemini 3.8-Flash AI Suite
* **Base64 PDF Resume Extraction**: Directly upload existing resumes in PDF format; the AI extracts raw text and auto-hydrates form fields[cite: 1].
* **Google X-Y-Z Bullet Point Enhancer**: Converts basic project notes into metric-driven points: *"Accomplished [X], as measured by [Y], by doing [Z]"*[cite: 1].
* **Semantic ATS Job Matcher**: Scores candidate resumes against target job descriptions, evaluating keyword matches, seniority requirements, and domain alignment.
* **Executive Summary Generator**: Produces third-person professional summaries without generic buzzwords[cite: 1].

### 🧭 Sliding Navigation Wizard & Profile Links
* **Sliding Navigation Bar**: Framer Motion tab slider with scroll arrows and step indicators.
* **Clickable Online Profiles**: Add direct, clickable links for **GitHub**, **LinkedIn**, **LeetCode**, **Codeforces**, **Portfolio**, or custom platforms.

### 📄 11 ATS-Optimized Print Templates[cite: 1]
* `Modern Tech`[cite: 1]
* `Executive Serif`[cite: 1]
* `Creative Sidebar`[cite: 1]
* `Compact Grid`[cite: 1]
* `Pure Minimal`[cite: 1]
* `Corporate Banner`[cite: 1]
* `Career Timeline`[cite: 1]
* `Legal / Academic`[cite: 1]
* `Bold Designer`[cite: 1]
* `Clinical Healthcare`[cite: 1]
* `Blank Canvas`[cite: 1]

### 🎯 Pre-Loaded Industry Profiles[cite: 1]
* Complete archetypes for Java Backend, MERN Stack, Legal, Healthcare, Data Science, Education, UI/UX, Sales, and Finance[cite: 1].

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone [https://github.com/silent-coder-dev/ai-resume-studio.git](https://github.com/silent-coder-dev/ai-resume-studio.git)
cd ai-resume-studio
2. Install Dependencies
Bash
npm install
3. Setup Environment Variables
Create a .env.local file in your project root:

Code snippet
GEMINI_API_KEY="your-google-gemini-api-key"
4. Run Development Server
Bash
npm run dev
Open http://localhost:3000 in your browser or view the deployed version at https://ai-resume-builder-silent.vercel.app.

📂 Project Structure
Plaintext
src/
├── app/
│   ├── api/ai/route.ts              # Gemini 3.8-Flash API (Parser, Matcher, Enhancer)
│   ├── globals.css                  # Print media queries (@page A4) & base styles
│   ├── layout.tsx                   # Root HTML shell & metadata
│   └── page.tsx                     # Studio editor & preview layout
├── components/
│   ├── layout/Footer.tsx            # Application footer component
│   ├── preview/
│   │   ├── AllTemplates.tsx         # 11 reorder-compliant resume templates
│   │   └── ResumeCanvasContainer.tsx# Canvas container with scale responsiveness
│   ├── ui/
│   │   └── AtsScoreMeter.tsx        # Dynamic circular ATS score gauge
│   └── wizard/
│       ├── FormWizard.tsx           # Multi-step editor with slider tabs & links
│       ├── JobMatcherModal.tsx      # Semantic JD matcher & gap analysis
│       ├── SectionReorderModal.tsx  # Dynamic section reorder & visibility modal
│       └── UploadResumeModal.tsx    # Native Base64 PDF parsing modal
├── store/
│   └── useResumeStore.ts            # Zustand store managing resume data & section order
├── types/
│   ├── initialResumeData.ts         # Sample profile datasets for 10 industries
│   └── resume.ts                    # Core TypeScript interfaces
└── utils/
    ├── atsScore.ts                  # ATS heuristics calculation logic
    └── exportPdf.ts                 # Isolated hidden iframe PDF sandboxing utility
📜 License
Distributed under the MIT License. Engineered by silent_coder
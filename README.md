# AI Resume Studio

An interactive, ATS-optimized resume builder built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Google Gemini AI**. Designed for speed, precision, and vector-grade PDF export with zero browser print artifacts.

---

## Features

- **Gemini AI Integration**:
  - Auto-generate impactful, ATS-friendly professional summaries.
  - Transform raw, casual work notes into quantifiable Google X-Y-Z bullet points.
  - Native document parsing: Upload existing resumes (`.pdf`, `.docx`, `.txt`) via Base64 streaming to automatically hydrate form fields.
- **11 Modular Templates**:
  - `Blank Canvas`, `Modern Tech`, `Executive Serif`, `Creative Sidebar`, `Compact Grid`, `Pure Minimal`, `Corporate Banner`, `Career Timeline`, `Legal / Academic`, `Bold Designer`, and `Clinical Healthcare`.
- **Pre-loaded Industry Profiles**:
  - 10 comprehensive archetypes (Java/Spring Boot Engineer, MERN Stack Developer, Corporate Lawyer, Doctor, Educator, Sales Lead, UI/UX Designer, CFA Analyst, HR Lead, Data Scientist) plus a blank canvas.
- **Real-Time ATS Scorer**:
  - Dynamic radial score gauge with actionable feedback tips and confetti trigger at 100% optimization.
- **Clean Vector PDF Export**:
  - Configured `@page` and `@media print` rules stripping default browser timestamps, URLs, page counts, and titles.
- **Customization Suite**:
  - Dynamic palette selector, optional profile photo uploader, and toggleable Certifications & Honors sections.

---

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **State Management**: Zustand (with local persistence)
- **Styling**: Tailwind CSS
- **Motion & FX**: Framer Motion, Canvas Confetti
- **Icons**: Lucide React
- **AI Backend**: Google Generative AI (`gemini-3.8-flash` / `gemini-3.1-flash-lite` fallback chain)

---

## Getting Started

### 1. Clone the repository
```bash
git clone [https://github.com/silent-coder-dev/ai-resume-studio.git](https://github.com/silent-coder-dev/ai-resume-studio.git)
cd ai-resume-studio
2. Install dependencies
Bash
npm install
3. Configure environment variables
Create a .env.local file in the root directory:

Code snippet
GEMINI_API_KEY="your-google-gemini-api-key"
4. Run the development server
Bash
npm run dev
Open http://localhost:3000 with your browser.

Project Structure
Plaintext
src/
├── app/
│   ├── api/ai/route.ts      # Gemini API route with retry & model fallback
│   ├── globals.css          # Print CSS (@page margin: 0) & theme setup
│   ├── icon.tsx             # Vector SVG dynamic favicon
│   ├── layout.tsx           # Global HTML/metadata configuration
│   └── page.tsx             # Split-screen editor & canvas orchestration
├── components/
│   ├── layout/Footer.tsx    # Branded footer component
│   ├── preview/
│   │   ├── AllTemplates.tsx # 11 responsive, ATS-optimized print templates
│   │   └── ResumeCanvasContainer.tsx # Canvas wrapper with zoom/scale physics
│   ├── ui/
│   │   └── AtsScoreMeter.tsx# Circular SVG score gauge with popover
│   └── wizard/
│       ├── FormWizard.tsx   # Multi-step state form wizard with tab pills
│       └── UploadResumeModal.tsx # Multi-format resume parser modal
├── store/
│   └── useResumeStore.ts    # Zustand store with persistence
├── types/
│   ├── initialResumeData.ts # Default profiles & sample datasets
│   └── resume.ts            # Core TypeScript interfaces
└── utils/
    └── atsScore.ts          # ATS calculation engine & heuristics
License
MIT License. Crafted with dedication by silent_coder.
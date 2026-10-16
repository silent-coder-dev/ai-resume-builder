# 2. Approaches — How It Is Built and Why

> **Read time:** about 15 minutes
> **Before this:** [1. Problem and Solution](./01-PROBLEM-AND-SOLUTION.md) · **Next:** [3. Design System](./03-DESIGN-SYSTEM.md)

This page explains **every main decision** in the project: what we chose, how it works, and why we chose it over other options. It is written in simple English, so you do not need to be an expert to follow it.

---

## Table of contents

1. [The big picture](#1-the-big-picture)
2. [Saving data: one store in the browser](#2-saving-data-one-store-in-the-browser)
3. [The resume data model](#3-the-resume-data-model)
4. [The editor: a 7-step wizard](#4-the-editor-a-7-step-wizard)
5. [Templates: one engine, 11 looks](#5-templates-one-engine-11-looks)
6. [The live A4 preview](#6-the-live-a4-preview)
7. [PDF download: the browser print engine](#7-pdf-download-the-browser-print-engine)
8. [AI: one server route, many actions](#8-ai-one-server-route-many-actions)
9. [Keeping the AI honest](#9-keeping-the-ai-honest)
10. [Importing a PDF resume](#10-importing-a-pdf-resume)
11. [Job matching and the 3-check gate](#11-job-matching-and-the-3-check-gate)
12. [The ATS score](#12-the-ats-score)
13. [Safety, privacy, and limits](#13-safety-privacy-and-limits)
14. [Quality checks](#14-quality-checks)
15. [Options we did not choose](#15-options-we-did-not-choose)
16. [The home page](#16-the-home-page)

---

## 1. The big picture

The website has **two parts**:

| Part | Where it runs | What it does |
|---|---|---|
| **The app** (pages, forms, preview, PDF) | In the user's browser | Everything the user sees and touches |
| **The AI route** (`/api/ai`) | On the server (Vercel) | Talks to the AI provider. Keeps the API key secret. |

```
 Browser (the app)                          Server
┌──────────────────────────┐   POST    ┌──────────────────┐   HTTPS   ┌──────────────┐
│ Home page  ·  Editor     │ ───────▶  │  /api/ai route   │ ────────▶ │ Gemini or    │
│ Live preview · PDF       │ ◀───────  │  (checks input,  │ ◀──────── │ OpenRouter   │
│ Saved draft (localStorage)│   JSON   │   calls the AI)  │           │ AI models    │
└──────────────────────────┘           └──────────────────┘           └──────────────┘
```

**Why this approach?**

- **Fast:** typing, switching templates, and the preview all happen in the browser. No waiting for a server.
- **Private:** there is no database. The resume lives in the user's own browser.
- **Safe:** the AI API key is only on the server. The browser never sees it.
- **Cheap to host:** the server only works when someone presses an AI button.

**Tech stack:** Next.js 16 (App Router) · React 19 · TypeScript 5 (strict) · Tailwind CSS 4 · Zustand 5 · Framer Motion · Lucide icons · Google Gen AI SDK.

---

## 2. Saving data: one store in the browser

**File:** `src/store/useResumeStore.ts`

All resume data lives in **one Zustand store**. Think of it as one shared box that every part of the app can read from.

### What is inside the store

| Field | What it holds |
|---|---|
| `resumeData` | The whole resume (personal info, skills, experience, and so on) |
| `activeTemplate` | Which of the 11 templates is selected |
| `accentColor` | The chosen accent color (hex code) |
| `sectionOrder` | The order of the 7 sections and whether each is shown or hidden |

### How changes happen

Every change goes through a **named action**, for example `updateSkill`, `addExperience`, or `moveSection`. Components never edit the data directly.

**Why?** If a component copies the data, edits it, and writes it back, it can overwrite a change that happened a moment earlier. Named actions always work on the latest data, so nothing is lost.

### How saving works

- The store uses Zustand's `persist` feature to save to **localStorage** under the key **`ai-resume-builder-store`**.
- Only the four fields above are saved. Temporary things (like an open menu) are not.
- Saving is wrapped in `try / catch`. If the browser blocks storage (private mode, full disk), the app keeps working — it just cannot save.

### Repairing old or broken saved data

Saved data can be old (from an earlier version) or damaged. When the app loads saved data, it **repairs it first**:

- Missing lists (for example, no `certifications`) become empty lists.
- The section order is cleaned: unknown sections are removed, duplicates are removed, and missing sections are added back.
- Drafts saved under the **old key** (`ai_resume_studio_store`) are moved to the new key once, so no user loses their work.

### Avoiding the "flash" problem (hydration)

The server builds the first HTML of the page, but the server **cannot see localStorage**. So the server always thinks the resume is empty. If the browser then showed the saved resume straight away, React would see two different pages and complain (this is called a *hydration mismatch*).

**Our approach:** a small hook, `useStoreHydrated()` (`src/store/useStoreHydrated.ts`), tells components when the saved data is ready.

- The editor shows a short *"Opening your resume…"* message until then.
- The home page only shows *"Continue saved resume"* after it knows a draft exists.

Result: no errors, no flash of an empty resume.

---

## 3. The resume data model

**File:** `src/types/resume.ts`

```ts
ResumeData {
  personalInfo   // name, target role, email, phone, location, summary
  links[]        // GitHub, LinkedIn, portfolio …
  skills[]       // one skill per row
  experiences[]  // company, role, dates, rough notes, bullet points
  projects[]     // title, tech stack, description
  education[]    // degree, institution, field, year, marks
  certifications[]
  achievements[]
}
```

Every list item has a unique **`id`**. All edits find items by `id`, never by position. This keeps edits correct even when items are added, removed, or reordered.

### "Filled" checks

**File:** `src/utils/resumeContent.ts`

When a user clicks "Add Skill" but types nothing, the app has an empty row. We do not want empty rows to:

- show up as blank boxes on the resume,
- raise the ATS score,
- count as "evidence" for the AI.

So we have small helper checks like `isFilledSkill`, `isFilledExperience`, and `hasResumeContent`. Templates, the ATS score, and the AI features all use the **same** checks, so they always agree.

---

## 4. The editor: a 7-step wizard

**File:** `src/components/wizard/FormWizard.tsx`

The form is split into 7 steps:

`Personal → Skills → Experience → Projects → Education → Certifications → Achievements`

**Why steps instead of one long form?**

- A long form feels heavy. Small steps feel easy and give a sense of progress.
- On a phone, one long form means endless scrolling.

**Small details that make the flow smooth:**

- The active tab slides with an animation and scrolls itself into view.
- Each step opens at the top.
- Empty steps show a short friendly hint (for example: *"Freshers can skip this step"*).
- Work experience has an **"I currently work here"** checkbox that shows "Present".
- AI-written bullet points are **editable** (one bullet per line) and can be removed with *"Use my notes instead"*.
- Every AI error appears right next to the button that caused it.

**Desktop vs mobile:**

- **Desktop:** the form is on the left and the live preview is on the right.
- **Mobile:** an **Edit Form / Live Preview** switcher sticks just under the header. Its position is measured from the real header height, so it never hides behind it.

---

## 5. Templates: one engine, 11 looks

**File:** `src/components/preview/AllTemplates.tsx`

All 11 templates share **one section engine** called `DynamicSectionsRenderer`. Each template only designs its own **header** (name, title, contact details) and page frame.

```
Template = its own header design  +  the shared section engine
```

**Why?**

- A fix or new feature in a section (for example, how education is shown) works in **all 11 templates at once**.
- The section order and show/hide settings work everywhere with no extra code.

**Rules every template follows:**

| Rule | Why |
|---|---|
| Fixed width of 794 px and a minimum height of 1123 px | This is exactly one A4 page at 96 DPI |
| A section with no real content is not drawn at all | No empty headings or lines on the resume |
| Contact details show separators only between values that exist | No stray "•" or "\|" when a field is empty |
| Placeholder text ("Your Full Name") is shown faded and is **removed from the PDF** | Helpful while editing, never printed by mistake |
| Skill levels (Beginner / Intermediate / Professional) are not printed | They help the AI, but look odd on a resume |
| `break-inside: avoid` on sections and items | Reduces awkward cuts across pages |

**Section order:** the user can move sections up or down and hide them in the **Reorder** window. The name and contact details always stay at the top, because ATS systems expect them there.

---

## 6. The live A4 preview

**File:** `src/components/preview/ResumeCanvasContainer.tsx`

- The resume is always drawn at real A4 size (794 × 1123 px), then **scaled down** to fit the screen. This keeps the preview identical to the PDF.
- A **ResizeObserver** watches the size of the resume page. When the content grows, the app recalculates:
  - the page count ("1 Page (Optimal for ATS)" or "Multi-Page"),
  - where to draw the **red dashed A4 cut lines**.
- When the user switches templates, the new page is watched right away, so the page count stays correct.
- Zoom buttons (− / + / fit) let the user zoom between 35% and 140%.

---

## 7. PDF download: the browser print engine

**File:** `src/utils/exportPdf.ts`

We use the **browser's own "Save as PDF"** instead of turning the page into a picture.

**How it works, step by step:**

1. Copy the resume page (`#printable-resume-canvas`).
2. Remove editor-only parts (cut lines, placeholders) — anything with the `no-print` class.
3. Put the copy inside a **hidden iframe**, together with the app's styles and fonts.
4. Wait until the styles and fonts are loaded (with a 2.5 s safety limit).
5. Open the print dialog. The file name is suggested as `Your_Name_Resume`.

**Print rules** (`src/app/globals.css`):

- `@page { size: A4 portrait; margin: 0; }` sits **outside** `@media print`. With zero page margin, the browser has no space to add its own URL, date, or page number.
- Colors are forced to print exactly (`print-color-adjust: exact`), so colored banners and lines show up.

**Why print instead of an image-based PDF?**

| Browser print (our choice) | Screenshot → PDF |
|---|---|
| Real text — ATS can read it | Text becomes a picture — ATS cannot read it |
| Sharp at any zoom | Blurry when zoomed |
| Small file size | Large file size |
| Links stay clickable | Links are lost |

---

## 8. AI: one server route, many actions

**File:** `src/app/api/ai/route.ts`

There is only **one** AI endpoint: `POST /api/ai`. The request says which **action** it wants:

| Action | Used by | What it returns |
|---|---|---|
| `parse-resume-pdf` | PDF import | The resume as structured JSON |
| `generate-summary` | AI Summary Studio | A 3-sentence summary (plain text) |
| `enhance-experience` | AI Enhance button | 2–3 bullet points (JSON list) |
| `optimize-resume` | Optimize with AI | The resume with polished wording only |
| `match-job` | Job Match | A full fit analysis + an optional sync token |
| `tailor-resume` | Sync resume with JD | The tailored resume (needs a valid sync token) |
| `generate-cover-letter` | API only (no button yet) | A cover letter (plain text) |

**Calling the route from the browser:** every feature uses one helper, `callAi()` (`src/utils/aiClient.ts`). It turns network failures, timeouts, and non-JSON error pages into short, clear messages for the user.

### Choosing the AI provider

Set with environment variables on the server:

| `AI_PROVIDER` | Models used |
|---|---|
| `gemini` (default) | `gemini-3.8-flash`, falling back to `gemini-3.1-flash-lite` |
| `openrouter` | `OPENROUTER_MODEL` (default `google/gemini-2.5-flash`) plus optional `OPENROUTER_FALLBACK_MODELS` |

### When the AI is busy or down

- **Busy (HTTP 500 / 503):** wait and try again — 500 ms, then 1 s — up to 2 retries.
- **Model missing or out of quota (HTTP 404 / 429):** skip straight to the fallback model.
- **Still failing:** the user sees *"The AI service is temporarily busy. Please try again shortly."*
- The route can run for up to 60 seconds (`maxDuration = 60`).

### Getting clean JSON back

1. For Gemini, every action that needs JSON asks for it directly (`responseMimeType: 'application/json'`).
2. The server still cleans the reply: it removes ``` fences and cuts out the JSON part (`extractCleanJson`).
3. The browser then passes the result through `normalizeResumeData()`, which:
   - fills missing fields,
   - drops empty items,
   - trims text,
   - makes sure no two items in a list share the same `id`.

So even if the AI returns something a little off, the app stays stable.

---

## 9. Keeping the AI honest

This is the core idea of the product: **improve the wording, never change the facts.** We use five layers of protection:

**Layer 1 — Clear rules in every prompt.** Each AI instruction lists what is forbidden: inventing skills, tools, employers, dates, degrees, licenses, numbers, or results.

**Layer 2 — Data is not instructions.** Resume text and job descriptions are clearly marked as *data* inside the prompt. If someone hides a command inside a job post (for example, "ignore all rules"), the AI is told not to follow it.

**Layer 3 — The server only accepts allowed changes.** For *Optimize with AI*, the server sends only the narrative text to the AI. When the answer comes back, the server copies **only** these fields back:

- summary,
- experience notes and bullets (same number of bullets),
- project descriptions,
- achievement descriptions.

Names, dates, skills, education, and certifications can never be changed by this feature.

**Layer 4 — The user reviews everything.** The review window shows **every change side by side** (Original vs Suggested). Nothing is saved until the user presses *Apply*.

**Layer 5 — Safe apply.** When applied, the changes are matched to the **current** resume by `id`. If the user added a new row while the AI was working, it is kept.

---

## 10. Importing a PDF resume

**Files:** `src/utils/resumeImport.ts`, `src/components/wizard/UploadResumeModal.tsx`, `src/components/home/StudioLanding.tsx`

**How it works:**

1. **Check the file in the browser:** it must end in `.pdf` (or have a PDF type), be between 1 byte and 8 MB, and start with `%PDF-` (the signature of every real PDF). This catches renamed Word files early.
2. **Send the whole PDF** to the server as Base64 text.
3. **The AI reads the PDF directly** (Gemini `inlineData`, or the OpenRouter file parser). It sees the real layout, tables, and columns.
4. **Strict extraction rules:** copy only what is visible; do not guess; keep each education record separate (Class 10, Class 12, degree, and so on); leave missing sections empty.
5. **Normalize** the result (see section 8) and load it into the editor.

**Why send the real PDF instead of reading the text in the browser?** Text reading in the browser often mixes up columns, loses headings, and breaks lines in strange places. Letting the AI see the real document gives much better results.

**Overwrite safety:** importing replaces the current draft, so the app always tells the user first (a warning in the import window, and a confirm box on the home page).

---

## 11. Job matching and the 3-check gate

**Files:** `src/app/api/ai/route.ts` (`analyzeResumeForJob`), `src/components/home/StudioLanding.tsx`

### Step 1 — Analysis

The AI compares the resume with the job description and returns:

- up to **14 requirements**, each marked *required* or *preferred*, with the evidence it found,
- matched and missing skills,
- warnings: domain mismatch, missing license, seniority gap,
- practical tips and a summary suggestion.

The **match percentage** uses these weights:

| Part | Weight |
|---|---|
| Skill match | 40% |
| Role-relevant evidence | 25% |
| Seniority (years / level) | 20% |
| Domain alignment | 10% |
| Education and licenses | 5% |

> The percentage is only for information. **It never decides** whether tailoring is allowed.

### Step 2 — The 3-check gate

The server (not the AI alone) decides if **"Sync resume with JD"** is allowed. All of these must be true:

1. ✅ **Field aligned** — education, work, or projects are in the same or a related field.
2. ✅ **Relevant skills present** — the essential skills are shown in the resume.
3. ✅ **Experience level aligned** — for a fresher role, projects and coursework can count.
4. ✅ No *required* requirement is missing, and no license, seniority, or domain blocker.
5. ✅ At least 3 requirements were checked and at least 1 was met (so the decision is reliable).

### Step 3 — A signed permission slip (sync token)

If the gate passes, the server creates a **sync token**:

- It contains a fingerprint (SHA-256 hash) of the exact resume and job description, plus an expiry time of **15 minutes**.
- It is signed with **HMAC-SHA256** using a server secret (`AI_SYNC_TOKEN_SECRET`, or the AI key if that is not set).

The `tailor-resume` action **refuses** to run without a valid token. So nobody can skip the gate by calling the API directly, and the token cannot be reused for a different resume or job.

### Step 4 — Tailoring

The tailored resume keeps the same IDs, dates, and facts. It is saved to the editor, and the user gets an **"Open in editor"** link to review it.

---

## 12. The ATS score

**File:** `src/utils/atsScore.ts`

A simple, transparent score out of 100. Only **filled** items count.

| Check | Points |
|---|---|
| Full name | 5 |
| Email | 5 |
| Phone | 5 |
| Location | 5 |
| Summary longer than 30 characters | 5 |
| Skills: 5 or more = 20 · 1 to 4 = 10 | 20 |
| Work experience added | 15 |
| Work experience has real details | 10 |
| At least one project | 15 |
| At least one education entry | 10 |
| At least one link | 5 |
| **Total** | **100** |

Every missed point becomes a tip in the score popup. Reaching **100** shows a small confetti celebration.

**Why a simple score?** Users can understand it and act on it straight away. It is a guide to completeness, not a copy of any company's private system — and the website says so.

---

## 13. Safety, privacy, and limits

| Area | What we do |
|---|---|
| API keys | Only on the server, never sent to the browser |
| Resume storage | Only in the user's browser; no database, no account |
| What goes to the AI | Only the data a feature needs, only when the user presses that button |
| Input limits | PDF ≤ 8 MB · job description 80–30,000 characters · job file (.txt / .md) ≤ 1 MB · resume JSON ≤ 60,000 characters · experience notes ≤ 5,000 characters |
| Bad requests | Invalid JSON or missing fields get a clear `400` error, not a crash |
| Links on the resume | Opened with `rel="noopener noreferrer"`; a missing `https://` is added automatically |
| Overwrites | Loading a sample, importing a PDF, starting fresh, or syncing a different resume always asks first |

---

## 14. Quality checks

| Check | Command |
|---|---|
| Type safety (strict TypeScript) | `npx tsc --noEmit` |
| Code style and React rules | `npm run lint` |
| Production build | `npm run build` |

The main user journeys were also checked in a real headless browser: no hydration errors, saved drafts restored, old drafts migrated, page counter correct after template switches, PDF frame built correctly, and the mobile layout has no sideways scrolling.

---

## 15. Options we did not choose

| Option | Why we did not use it |
|---|---|
| A database and user accounts | More cost and more privacy risk. Most users only need one draft on one device. |
| Calling the AI straight from the browser | It would expose the API key to everyone. |
| Screenshot-based PDF (`html2canvas` + `jsPDF`) | Text becomes an image that ATS cannot read; files are big and blurry. |
| Reading PDF text in the browser | Loses columns, headings, and structure. The AI reading the real PDF is far more accurate. |
| Letting the AI rewrite the full resume freely | Too easy for it to add false claims. We only accept wording changes to existing text. |
| Using the match percentage to unlock tailoring | A number can hide a real problem (like a missing license). Clear yes/no checks are safer. |
| A separate component for each template's sections | 11 copies of the same code; fixes would be missed. One shared engine is easier to keep correct. |
| Screenshots of templates on the home page | Images go out of date the moment a template changes. Rendering the real templates keeps the gallery always correct. |

---

## 16. The home page

**Folder:** `src/components/home/`

The home page has one job: show people, in a few seconds, that this tool is beautiful **and** honest — then get them started.

**How it is built:**

- **One file per section.** `StudioLanding.tsx` only lists the sections in order. The hero, features, gallery, job match, and FAQ each live in their own file, so they are easy to find and change.
- **Real templates, not pictures.** The hero and the gallery render the same template components the editor uses, scaled down with `ScaledResume`. Templates come from one shared list, `templateCatalog.tsx`, so a new template appears in the editor **and** the gallery automatically.
- **Fixed section order for previews.** Templates normally read the user's saved section order. The home page passes the default order instead (`sectionOrder` prop), so the server HTML and the browser always match — no hydration errors.
- **A made-up demo person.** Previews use `landingDemoResume.ts` with `example.com` contact details, so no real person's data is shown publicly.
- **"Use this template" changes only the look.** It saves the chosen template and color, then opens the editor. The user's resume content is never touched, so no confirm box is needed.
- **The same safety rules as before.** Start from scratch, Import a PDF, and Sync with JD still ask before replacing a saved draft.
- **Motion with manners.** Animations run once on scroll or loop slowly in the background, and switch off for people who prefer reduced motion (`MotionConfig reducedMotion="user"`).

➡️ Next: **[3. Design System — fonts, colors, and templates](./03-DESIGN-SYSTEM.md)**

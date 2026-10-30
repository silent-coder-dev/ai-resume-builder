# 2. Approaches — How It Is Built and Why

> **Read time:** about 18 minutes
> **Before this:** [1. Problem and Solution](./01-PROBLEM-AND-SOLUTION.md) · **Next:** [3. Design System](./03-DESIGN-SYSTEM.md)

This page explains **every main decision** in the project: what we chose, how it works, and why. It is written in simple English, so you do not need to be an expert to follow it.

---

## Table of contents

1. [The big picture](#1-the-big-picture)
2. [Pages and navigation](#2-pages-and-navigation)
3. [Saving data: a storage service on IndexedDB](#3-saving-data-a-storage-service-on-indexeddb)
4. [Many resumes: the resume record](#4-many-resumes-the-resume-record)
5. [Autosave and the save status](#5-autosave-and-the-save-status)
6. [Never losing work: recovery, tabs, versions, undo](#6-never-losing-work-recovery-tabs-versions-undo)
7. [Creating a new resume safely](#7-creating-a-new-resume-safely)
8. [Backups and old drafts](#8-backups-and-old-drafts)
9. [The resume data model and sections](#9-the-resume-data-model-and-sections)
10. [The editor (workspace)](#10-the-editor-workspace)
11. [Templates and the live preview](#11-templates-and-the-live-preview)
12. [PDF download](#12-pdf-download)
13. [AI: one server route, many actions](#13-ai-one-server-route-many-actions)
14. [Keeping the AI honest](#14-keeping-the-ai-honest)
15. [The Resume Analyzer](#15-the-resume-analyzer)
16. [The Job Matcher and tailored copies](#16-the-job-matcher-and-tailored-copies)
17. [GitHub Projects](#17-github-projects)
18. [Interview Prep](#18-interview-prep)
19. [Safety, privacy, and limits](#19-safety-privacy-and-limits)
20. [Quality checks and tests](#20-quality-checks-and-tests)
21. [Options we did not choose](#21-options-we-did-not-choose)

---

## 1. The big picture

The website has **two parts**:

| Part | Where it runs | What it does |
|---|---|---|
| **The app** (pages, editor, preview, PDF, storage) | In the user's browser | Everything the user sees and touches |
| **Two server routes** (`/api/ai`, `/api/github`) | On the server (Vercel) | Talk to the AI provider and to GitHub. Keep secrets on the server. |

```
 Browser (the app)                              Server
┌──────────────────────────────┐   POST   ┌───────────────────┐  HTTPS  ┌──────────────┐
│ Home · Builder · My Resumes  │ ───────▶ │ /api/ai           │ ──────▶ │ Gemini or    │
│ Analyzer · Job Matcher · …   │ ◀─────── │ (limits, checks,  │ ◀────── │ OpenRouter   │
│                              │   JSON   │  calls the AI)    │         └──────────────┘
│ IndexedDB: all your resumes  │          ├───────────────────┤  HTTPS  ┌──────────────┐
│ localStorage: settings only  │ ───────▶ │ /api/github       │ ──────▶ │ GitHub API   │
└──────────────────────────────┘   GET    └───────────────────┘         └──────────────┘
```

**Why this approach?**

- **Fast:** typing, switching templates, and the preview all happen in the browser.
- **Private:** there is no database and no account. Resumes live in the user's own browser.
- **Safe:** API keys stay on the server. The browser never sees them.
- **Cheap to host:** the server only works when someone uses an AI or GitHub feature.

**Tech stack:** Next.js 16 (App Router) · React 19 · TypeScript 5 (strict) · Tailwind CSS 4 · Zustand 5 · IndexedDB · Lucide icons · Google Gen AI SDK · Vitest · Playwright.

---

## 2. Pages and navigation

| Address | Page |
|---|---|
| `/` | Home page |
| `/builder` | Resume Builder (the workspace) |
| `/resumes` | My Resumes |
| `/analyzer` | Resume Analyzer |
| `/job-match` | Job Matcher |
| `/github` | GitHub Projects |
| `/interview` | Interview Prep |
| `/settings` | Settings |
| `/privacy` | Privacy & Data |

All app pages (everything except the home page) sit in one **route group**, `src/app/(studio)/`. They share one layout, the **App Shell** (`src/components/shell/AppShell.tsx`):

- **Desktop:** a left sidebar with every tool. It can collapse to icons. It collapses by itself on narrow screens and in the Builder, unless the user chose otherwise.
- **Phone:** a top bar with a menu button that opens the same links in a dialog.
- A **"Skip to content"** link for keyboard users.

**Why one shell?** Every tool needs the same resume list, the same save status, and the same warnings. Putting them in one place means they always behave the same.

### The Builder address

The Builder always knows which resume to open:

| Address | What opens |
|---|---|
| `/builder?id=abc` | Resume `abc` |
| `/builder` | The last resume you edited (the address is updated to include its `id`) |
| `/builder` with no resumes | A "create your first resume" form |
| `/builder?new=1` | The create form |
| `/builder?id=abc&section=projects` | Resume `abc`, open at Projects |

Because the resume `id` is in the address, **refresh and Back always land on the same resume**.

---

## 3. Saving data: a storage service on IndexedDB

### What we use

Resumes are saved in **IndexedDB**, a database built into every modern browser. Pages never talk to IndexedDB directly. They use a small **storage service**:

| File | Job |
|---|---|
| `src/lib/storage/backend.ts` | Opens the database. Has a memory-only backup for browsers that block storage. |
| `src/lib/storage/resumeRepository.ts` | `createResume`, `getResume`, `getAllResumes`, `updateResume`, `renameResume`, `deleteResume`, `duplicateResume`, `saveVersion`, `listVersions`, `deleteAllData`, … |
| `src/lib/storage/backup.ts` | JSON export and import |
| `src/lib/storage/recovery.ts` | Old-draft migration and the unsaved-changes copy |

The database is called `ai-resume-studio` and has three tables:

| Table | Holds |
|---|---|
| `resumes` | One row per resume |
| `versions` | Saved versions (up to 20 per resume) |
| `meta` | Small facts, like which resume was edited last |

`localStorage` is used only for two small things: your **settings** (`ai-resume-studio:preferences`) and the **unsaved-changes copy** (`ai-resume-studio:unsaved-changes`).

### Why IndexedDB and not localStorage?

| | localStorage (old design) | IndexedDB (now) |
|---|---|---|
| Space | About 5 MB for the whole site | Much more |
| Many resumes | Awkward — one big text blob | Natural — one row each |
| Safe updates | Whole blob rewritten every time | One row at a time, in a transaction |
| Version history | Hard | A separate table |

### If the browser blocks storage

Some private windows block IndexedDB. Then the app switches to **memory mode**: it still works, shows a clear banner ("This browser is not allowing saved data…"), and warns before you leave the page. You can still download a PDF or export a backup.

### Why a service and not direct calls?

- One place to change if the storage ever moves (for example, to cloud sync).
- Easy to test: the unit tests run the same service against a fake IndexedDB.

---

## 4. Many resumes: the resume record

Each resume is saved as one **record**:

```ts
type ResumeRecord = {
  id: string;
  title: string;             // "Java Developer Resume"
  createdAt: string;
  updatedAt: string;
  careerStage: 'student' | 'fresher' | 'experienced' | null;
  templateId: string;        // "modern"
  accentColor: string;       // "#4f46e5"
  sectionOrder: SectionItem[];
  data: ResumeData;          // the actual resume content
  schemaVersion: number;     // 2
  sourceResumeId?: string;   // set on copies and tailored versions
  tailoredFor?: string;      // job title, for tailored versions
};
```

**Why keep template, color, and section order inside the record?** So each resume looks the way you left it. Changing the template of your "Internship" resume does not change your "Java" resume.

**Why `schemaVersion`?** If the data shape changes in future, the app knows which records need repairing. Every record is passed through `coerceResumeRecord` when it is read, so old or damaged data is fixed instead of crashing the page.

The whole app reads and changes the open resume through **one Zustand store**, `src/store/useWorkspaceStore.ts`. Components never write to storage themselves.

---

## 5. Autosave and the save status

### How it works

1. You type. The store updates the resume in memory right away, so the preview changes instantly.
2. The store waits **700 ms** after your last key press, then saves to IndexedDB.
3. Bigger actions (adding or deleting an item, moving a section, changing the template) save **immediately**.
4. When the tab is hidden or closed, the store saves at once.

### The save status

The toolbar always shows one of these:

| Status | Meaning |
|---|---|
| *Saving…* | A save is running |
| *All changes saved* (with time) | Everything is stored |
| *Offline · saved on this device* | No internet; saving still works because storage is local |
| *Save failed* + **Retry** | Storage refused the save |
| *Changed in another tab* | The same resume was edited in another tab — see below |
| *Not saved — storage blocked* | The browser blocks storage (memory mode) |
| *Recovering previous changes…* | Unsaved edits from last time are being restored |

### Why debounce?

Saving on every key press would write to the database dozens of times per sentence. Waiting 700 ms still feels instant but writes far less.

### Leaving the page

The browser's "Leave site?" warning appears **only** when work could really be lost: a save failed, there is an unresolved conflict, or the browser is in memory mode. We do not show it on every exit, because a warning that always appears teaches people to ignore it.

---

## 6. Never losing work: recovery, tabs, versions, undo

### Unsaved-changes copy (crash recovery)

When the tab is hidden or closed and a save has not finished, the store writes a small copy of the open resume to `localStorage` (this is fast and finishes even while the page is closing). On the next visit:

- If the saved resume is older than this copy, the copy is restored and the status shows *Recovering previous changes…*.
- A version called **"Before recovering unsaved changes"** is saved first, so the restore can be undone.
- If the resume was deleted on purpose, the copy is ignored.

### Two tabs

Each save checks that the resume in storage has not changed since this tab loaded it (`updateResume(record, { expectedUpdatedAt })`). If another tab saved in between, this tab **does not overwrite it**. Instead it shows a choice:

- **Load the other version** — show the newer copy from the other tab, or
- **Keep my version** — save this tab's copy over it, or
- **Save as a new resume** — keep both.

Before either copy wins, the one being replaced is saved as a version, so neither is lost.

Tabs also tell each other about saves through a `BroadcastChannel`, so a tab with no local edits quietly loads the newer copy and the My Resumes list stays up to date.

### Version history

Up to **20 versions** per resume are kept. A version is saved automatically:

- before the first change of each visit ("Before this visit's edits"),
- every 10 minutes while editing,
- before AI polishing, GitHub imports, restoring a version, recovery, and conflict choices.

You can open **Version history** from the toolbar and restore any version. Restoring also saves the current state first, so nothing is lost.

### Undo and redo

The editor keeps the last **100 steps**. Typing in one field within one second counts as one step, so undo does not go letter by letter. Shortcuts: **Ctrl/Cmd+Z** (undo), **Ctrl/Cmd+Shift+Z** or **Ctrl+Y** (redo).

---

## 7. Creating a new resume safely

The old design had one draft, and "new resume" replaced it. Now **creating a new resume never touches an existing one**.

When you press **Create Resume** and you already have resumes, one dialog appears (`NewResumeDialog.tsx`):

| Choice | What happens |
|---|---|
| **Continue existing resume** | Shows your resumes; pick one to open |
| **Create new resume** | Shows the create form |
| **Cancel** | Nothing changes |

The create form (`CreateResumeForm.tsx`) asks for:

- a **name** (a suggestion is filled in),
- the **career stage** (Student, Fresher, Experienced),
- a **template**, and
- how to start: **Blank**, **Import PDF**, **Example resume** (10 roles), or **Copy of one of your resumes**.

Importing a PDF from inside the Builder (**More actions → Import a PDF as a new resume**) also creates a new resume; the open one is not changed.

Example resumes use made-up contact details (`example.com`), so a real person's email can never end up on someone else's resume.

---

## 8. Backups and old drafts

### JSON export and import

- **Export** one resume (toolbar or My Resumes) or all resumes (My Resumes or Privacy & Data) as a `.json` file.
- **Import** a `.json` file (up to 5 MB). Imported resumes always get **new IDs**, so they are added next to your resumes and never replace one.
- The importer also accepts a single resume record and the old single-draft format.

### Old drafts from the previous version

Before this version, the site kept one draft in `localStorage` (`ai-resume-builder-store`, and earlier `ai_resume_studio_store`). On the first visit after the update, that draft is **copied into IndexedDB as a normal resume**, once. The old key is left in place as an extra copy (a flag stops it being imported twice). **Delete all data** on *Privacy & Data* removes it too.

---

## 9. The resume data model and sections

`src/types/resume.ts` defines the content:

| Part | Fields |
|---|---|
| `personalInfo` | name, title, email, phone, location, **LinkedIn**, **GitHub**, **portfolio**, summary |
| Lists | skills, experiences, **internships**, projects, education, certifications, achievements, **languages**, other links |
| `customSections` | your own sections, each with a title and items |

### Sections

Every section has a key (`summary`, `education`, `custom:abc`, …). The **section order** is a list of `{ id, visible }`. You can move or hide each section.

The **career stage** decides the recommended order:

| Stage | Recommended order |
|---|---|
| Student / Fresher | Summary → Education → Projects → Skills → Internships → Certifications → Achievements → Experience → Languages |
| Experienced | Summary → Experience → Skills → Projects → Education → Certifications → Achievements → Internships → Languages |

`normalizeSectionOrder` repairs any order it reads: it removes duplicates and unknown keys and adds missing sections, so a damaged order can never hide a section forever.

### Two kinds of data cleanup

`src/utils/normalizeResumeData.ts` has two modes:

| Function | Used for | Empty rows |
|---|---|---|
| `normalizeResumeData` | AI output and imports | **Dropped** |
| `coerceResumeData` | Saved resumes | **Kept** (you may be halfway through typing one) |

Both give every item a unique ID and move LinkedIn, GitHub, and portfolio links from the general links list into their own fields.

---

## 10. The editor (workspace)

The Builder (`src/components/workspace/Workspace.tsx`) has three areas:

```
┌──────────────┬─────────────────────────┬─────────────────────┐
│ Section list │ Editor for one section  │ Live A4 preview     │
│ (move, hide, │ (fields, AI buttons,    │ (selected template) │
│  add custom) │  Previous / Next)       │                     │
└──────────────┴─────────────────────────┴─────────────────────┘
       Toolbar: name · save status · undo/redo · template · AI polish ·
                analyze · versions · download PDF · more
```

- **Desktop:** all three side by side.
- **Tablet and phone:** an **Edit / Preview** switch, and the section list becomes a picker.
- The preview uses React's `useDeferredValue`, so typing stays smooth even on slow phones.
- The last section you opened is remembered for each resume.

**Why one section at a time and not a long form?** A long form is tiring, and people lose their place. One section with clear Previous / Next buttons is calmer, and the section list shows where you are.

---

## 11. Templates and the live preview

- **11 templates** live in `src/components/preview/AllTemplates.tsx` and are registered once in `templateCatalog.tsx` (`TEMPLATE_CATALOG`, `COLOR_OPTIONS`).
- Every template receives the same props: `{ data, accentColor, sectionOrder }`. Templates are **pure**: they never read the store, so the same template works in the editor, the home page, the template picker, and PDF export.
- All templates render sections through one shared `DynamicSectionsRenderer`, so a new section (like Languages) only needs to be added once.
- Every template is **794 px wide** (A4 at 96 DPI). The preview scales it down to fit the screen and draws page-break lines.
- Empty sections and empty rows are never shown (`isFilled*` helpers in `src/utils/resumeContent.ts`). Placeholder text in the preview has the `no-print` class, so it never reaches the PDF.

---

## 12. PDF download

We use the **browser's own print engine**:

1. `exportPdf.ts` copies the resume (`#printable-resume-canvas`) into a hidden frame with the page styles and fonts.
2. It waits for styles and fonts to finish loading (up to 2.5 seconds).
3. It opens the print dialog; the user chooses **Save as PDF**.

From My Resumes, a resume that is not open is first drawn off-screen (`printRecord.tsx`) and then printed the same way.

**Print rules (`globals.css`):**

- `@page { size: A4; margin: 0 }` sits **outside** `@media print`, which stops browsers adding the URL and date to the page.
- Each template keeps its own padding. On multi-page resumes, `box-decoration-break: clone` repeats that padding on every page, so page 2 has the same margins as page 1.
- Sections and list items avoid being cut between pages.

**Why not a PDF library?** Libraries that turn the page into an image produce PDFs with no real text — ATS software cannot read them, and links stop working. The print engine produces real, selectable text and clickable links.

---

## 13. AI: one server route, many actions

All AI requests go through `callAi()` in `src/utils/aiClient.ts`, which posts to `/api/ai`:

```ts
callAi('rewrite-text', { text, action: 'concise', context })
```

| Action | Used by |
|---|---|
| `parse-resume-pdf` | Import PDF, and resume uploads in the Analyzer, Job Matcher, and Interview Prep |
| `read-job-pdf` | Job description uploaded as a PDF (copied word for word, never summarised) |
| `rewrite-text` | AI writing assistant (7 modes) |
| `generate-summary` | Summary writer |
| `enhance-experience` | "Write bullets from notes" |
| `optimize-resume` | AI polish (whole resume) |
| `analyze-resume` | AI review in the Analyzer |
| `match-job` / `tailor-resume` | Job Matcher |
| `describe-project` | GitHub Projects |
| `interview-questions` / `interview-feedback` | Interview Prep |
| `generate-cover-letter` | Kept in the route; not used by the app yet |

### Providers

- **Gemini** (default): `gemini-3.8-flash`, falling back to `gemini-3.1-flash-lite`. Retries on errors 500/503; switches model on 404/429.
- **OpenRouter**: set `AI_PROVIDER=openrouter`, with a main model and backup models.

### One model per tool (OpenRouter only)

To spread the load, three tools can use their own OpenRouter model (`src/lib/server/aiModels.ts`):

| Setting | Used for |
|---|---|
| `OPENROUTER_MODEL_ANALYZER` | The Resume Analyzer's AI review (`analyze-resume`) |
| `OPENROUTER_MODEL_JOB_MATCH` | The Job Matcher (`match-job`, `tailor-resume`) |
| `OPENROUTER_MODEL_INTERVIEW` | Interview Prep (`interview-questions`, `interview-feedback`) |

Everything else (writing help, PDF import, GitHub) uses `OPENROUTER_MODEL`. A tool's model is never the only option:

1. Each request lists the tool's model first and the main model as a backup. OpenRouter switches by itself when the first model is busy, rate limited, or not allowed.
2. If the tool's model answers but the answer is not usable JSON (or it takes longer than 25 seconds), the app asks the main model once more, within the 60-second limit.
3. Some models refuse to turn reasoning off. The app then uses short, hidden reasoning for that model and remembers it.

The server log shows which model answered each request, for example `[ai] match-job → liquid/lfm-2.5-2.6b:free`. No resume text is logged.

**Free models:** they are often busy, and some are only open to approved apps. Very small models can struggle with the long, strict JSON the Job Matcher needs. Test a model before relying on it.

Structured actions ask the AI for **JSON only**. The route cleans the reply (`extractCleanJson`), and the browser cleans it again (`normalizeResumeData`) before anything touches a resume.

PDF import sends the PDF itself (as Base64) to the AI, which reads it natively. This works far better than copying plain text out of the PDF in the browser.

### Errors the user sees

`callAi` turns every failure into a clear sentence: offline, too many requests (with the wait time), file too large, or a provider problem. AI failures never block editing.

---

## 14. Keeping the AI honest

This is the most important rule of the product: **AI should improve your story, never invent your achievements.**

### Rule 1 — The instructions forbid inventing

Every prompt says the AI may only rephrase what is already there. It must not add skills, numbers, employers, dates, degrees, or results. The "Add Relevant Keywords" mode may only use skills already in your skills list or text.

### Rule 2 — The AI asks instead of guessing

When a stronger line needs a fact you did not give (for example, a result), the AI puts a question in its **notes** ("How many users did this serve?") instead of making a number up.

### Rule 3 — You approve every change

No AI output is applied automatically. Every suggestion opens in **SuggestionReview**:

```
┌───────────── Original ─────────────┬──────────── Suggestion ────────────┐
│ Responsible for building the       │ Built the login page and REST API  │
│ login page and API.                │ for user sign-in.  (editable)      │
└────────────────────────────────────┴────────────────────────────────────┘
  Notes from the AI: "Add how many users signed in, if you know it."
                                        [ Reject ]  [ Accept ]
```

- The suggestion is **editable** before you accept it.
- **AI polish** (whole resume) lists every change one by one, each with its own Accept / Reject, and saves a version first.
- Accepting is one undo step, so **Ctrl+Z** brings the original back.

---

## 15. The Resume Analyzer

`src/lib/resume/analyzer.ts` gives a **readiness score out of 100**. It runs in the browser, instantly, with no AI.

**Two ways to choose the resume:**

- **A saved resume** — every issue has a **Fix** button that opens the right section in the Builder.
- **An uploaded PDF** — the AI reads the PDF into resume data (the same reader as *Import PDF*), and the analyzer scores it. You pick the career stage to score it as (a first guess is made from the PDF). The upload is **not saved**, so there are no Fix buttons; **Save as a resume** creates a new resume from it, and then the Fix buttons appear. The AI review, if you ran one, carries over.

| Category | Points |
|---|---|
| Contact details | 15 |
| Summary | 10 |
| Skills | 15 |
| Experience & projects | 35 |
| Education | 15 |
| Formatting | 10 |

| Score | Label |
|---|---|
| 85+ | Ready to send |
| 70–84 | Strong |
| 50–69 | Getting there |
| Below 50 | Needs work |

Each problem is an **issue** with: a severity (critical, warning, suggestion), a title, **why it matters**, **how to fix it**, and a **Fix** button that opens the right section in the Builder.

**Career stage matters.** Freshers and students are not marked down for having no job history — their projects and education count instead. Experienced candidates are expected to show work history.

**Optional AI review:** a button sends the resume to `analyze-resume` for grammar, clarity, and role-relevance notes. The score itself never depends on AI, so it is stable and explainable.

**Why "readiness" and not "ATS score"?** No outside tool can know a real company's ATS. We say clearly that the score is an **estimate** of how complete and clear the resume is.

---

## 16. The Job Matcher and tailored copies

1. Choose one of your resumes (or upload a PDF) and add a job description (80 to 30,000 characters): paste it, or upload a `.txt` file (read in the browser) or a PDF (copied out by `read-job-pdf`).
2. `match-job` returns: a match estimate, matched and missing **required** and **preferred** skills, **evidence** for each requirement, **keyword gaps**, **project alignment**, and three fit checks.
3. If all three checks pass, you can **Create tailored version**.

### The three fit checks

| Check | Passes when |
|---|---|
| Field aligned | Your education, work, or projects are in the same or a related field |
| Relevant skills present | Your resume shows the job's **essential** skills (a missing *preferred* skill does not fail this) |
| Experience level aligned | Your experience fits the job's level (projects count for fresher roles) |

**Why the checks?** Tailoring a resume to a job you do not fit would push the AI toward inventing things. The checks stop that.

### The permission token

When the checks pass, the server returns a signed token (HMAC, valid for 15 minutes) tied to that exact resume and job description. `tailor-resume` refuses to run without a valid token. This stops anyone from skipping the checks by calling the route directly.

### The original is never changed

The tailored result is saved as a **new resume** called, for example, "Java Developer Resume — Backend Engineer", with `sourceResumeId` pointing to the original and `tailoredFor` set to the job title. A message offers to open it.

---

## 17. GitHub Projects

1. Enter a GitHub username. `/api/github?username=` returns the user's public repositories (most recently updated first). Forks are hidden unless you ask for them.
2. Pick up to 6 repositories. For each, `/api/github?owner=&repo=` returns its languages and README (the first 8,000 characters).
3. `describe-project` writes a title, a short description, and a tech stack **only from the README, languages, and topics**.
4. Each draft is shown in an editable card. Change anything, untick what you do not want, choose a resume, and add. A version is saved first, and each project keeps its **Code** link (and **Live** link if the repository has a homepage).

The GitHub route validates names, handles "user not found", and explains GitHub's own rate limit with a wait time. An optional `GITHUB_TOKEN` raises GitHub's limits.

---

## 18. Interview Prep

1. **Your resume:** a saved resume, or an uploaded PDF (used for this session only; not saved).
2. **The job (optional):** paste a job description or upload it as a PDF or `.txt` file, and optionally a target role.
3. **Question types:** Technical, **Coding (with sample code)**, Project-based, Behavioral, Role-specific; and how many (4–10).
4. `interview-questions` prepares the questions.

**With a job description**, most questions test a specific **job requirement** (for example "REST APIs with Spring Boot"). Each technical, coding, project, and role question shows whether your resume covers it:

| Label | Meaning |
|---|---|
| *On your resume* | Your resume clearly shows this requirement |
| *Partly on your resume* | It shows something related |
| *Not on your resume* | A gap. The question is still asked (a real interviewer would), with a tip on answering honestly. |

Behavioral questions test soft skills and have no label. Without a job description, questions come from your resume and target role, as before.

**Coding questions and sample code:**

- Coding questions are added **only when the role involves writing code** (software, data, testing, DevOps…). For other roles the page says so and uses the other question types instead. This is how "code only when it makes sense" is decided.
- At most 3 coding questions, in the job's main programming language.
- Each one has a **sample solution** (up to 50 lines, commented) and a short explanation with time and space complexity. A technical question may also get a short snippet when it really helps.
- The sample answer and code are **hidden** behind *Show a sample answer and code*, so you try first. The code has a **Copy** button and a note to run and test it, because it is written by AI.

**Feedback:** type an answer (coding questions get a code-style box). `interview-feedback` rates it from 1 to 5 on accuracy, clarity, completeness, and communication. For coding answers, accuracy means correct code including edge cases, and completeness includes stating the complexity. It also lists strengths and improvements and gives an outline of a better answer. The feedback uses the same resume and job description the questions came from, and must not assume experience you do not have.

---

## 19. Safety, privacy, and limits

| Protection | How |
|---|---|
| API keys hidden | Only read on the server |
| **Rate limits** | Per visitor: 10 AI requests a minute and 150 a day by default (`AI_RATE_LIMIT_PER_MINUTE`, `AI_RATE_LIMIT_PER_DAY`). GitHub route: 20 a minute, 300 a day. Over the limit → status 429 with a friendly message and wait time. |
| Size limits | Request body 13 MB (status 413), PDF 8 MB, job description 30,000 characters, backup file 5 MB |
| Input checks | Unknown actions → 400; invalid JSON → 400; each action checks its own fields |
| No resume logging | The server never logs resume text. Errors log only short, general messages. |
| Safe links | Only `http`, `https`, and `mailto` links become clickable on resumes (`safeHref`) |
| Feature policy | `src/lib/entitlements.ts` decides which features are on. Everything is free at launch; the file is ready for future plans without changing every page. |
| Dependencies | `npm audit` reports 0 vulnerabilities; unused packages were removed |

**Note:** rate limits are counted in the server's memory, so each server instance counts separately. A strict global limit would need a shared store (for example, Redis).

**Privacy page:** `/privacy` explains what is stored, what each AI feature sends, how to export everything, and how to **delete all data** on this device (after a clear confirmation).

---

## 20. Quality checks and tests

Before any change is finished, all of these must pass:

```bash
npx tsc --noEmit     # types
npm run lint         # code style
npm test             # 33 unit tests (Vitest + fake IndexedDB)
npm run build        # production build
npm run test:e2e     # 18 browser tests (Playwright)
```

**Unit tests** cover the storage service, autosave, undo/redo, tab conflicts, version limits, backups, recovery, the analyzer, data cleanup, section order, link safety, and rate limits.

**End-to-end tests** run the real app in Microsoft Edge (desktop and phone sizes) and check every data-safety scenario in the PRD: refresh, Back, the new-resume dialog (continue, create, cancel), duplicate, delete, cleared storage, and old-draft migration. They also check AI approval (with a mocked AI), templates and PDF, keyboard use, dialogs, that phone pages never scroll sideways, and the upload flows: analyzing and saving an uploaded PDF, interview questions from an uploaded resume and job description (with sample code), and the job matcher with an uploaded resume. Any browser console error fails the test.

---

## 21. Options we did not choose

| Option | Why not |
|---|---|
| Accounts and a server database | More cost, more risk to personal data, and a sign-up step. Local storage plus JSON backups is enough for now. |
| Keep localStorage for resumes | Too small and unsafe for many resumes and versions |
| A PDF image library | No real text for ATS, no clickable links |
| Apply AI changes automatically | Breaks the "never invent" promise; users must stay in control |
| An AI-made score | Changes every time and cannot explain itself. The rule-based analyzer is stable and explainable. |
| Heavy animation and glass effects | Slower on phones and distracting. The PRD asks for a calm, professional look (see [Design System](./03-DESIGN-SYSTEM.md)). |

➡️ Next: **[3. Design System](./03-DESIGN-SYSTEM.md)**

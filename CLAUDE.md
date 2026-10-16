```markdown
# AI Resume Studio — Claude Development Guide

This guide summarizes project architecture, style standards, and terminal commands to assist AI coding agents working on this codebase.

---

## Build & Test Commands

- **Development Server**: `npm run dev` (starts on `http://localhost:3000`)
- **Production Build**: `npm run build`
- **Start Production Server**: `npm run start`
- **Linting**: `npm run lint`

---

## Key Architectural Principles

1. **State Management (`src/store/useResumeStore.ts`)**:
   - Single Zustand store holding `resumeData`, `activeTemplate`, `accentColor`, and `sectionOrder` (the wizard's active step is local component state).
   - Persisted to browser storage under `ai-resume-builder-store` (drafts under the legacy `ai_resume_studio_store` key are migrated on load). A `merge` step repairs saved data (missing lists, invalid section order).
   - All state mutations must occur via explicit store actions — never `useResumeStore.setState` with a copied `resumeData`.
   - Components that render saved data must wait for `useStoreHydrated()` (`src/store/useStoreHydrated.ts`) to avoid SSR hydration mismatches.

2. **Template Architecture (`src/components/preview/AllTemplates.tsx`)**:
   - Every template receives `{ data: ResumeData; accentColor: string; sectionOrder?: SectionItem[] }`, is 794px wide (A4 at 96 DPI), and renders sections through the shared `DynamicSectionsRenderer`. Pass `sectionOrder` (e.g. `DEFAULT_SECTION_ORDER`) for previews that must not read the user's saved order (the home page).
   - Templates and accent colors are registered once in `src/components/preview/templateCatalog.tsx` (`TEMPLATE_CATALOG`, `COLOR_OPTIONS`, `renderResumeTemplate`), used by both the editor and the home page gallery.
   - The printable wrapper is `#printable-resume-canvas` in `ResumeCanvasContainer.tsx`; `exportPdf.ts` clones it into a hidden iframe.
   - Proficiencies (`Beginner`, `Intermediate`, `Professional`) guide AI prompts but are omitted from rendered resume skill pills.
   - Sections and items with no real content must not render (use the `isFilled*` helpers in `src/utils/resumeContent.ts`). Placeholder text must use the `no-print` class so it never reaches the PDF.

3. **Print Engine Rules (`src/app/globals.css`, `src/utils/exportPdf.ts`)**:
   - `@page { margin: 0; size: A4 portrait; }` must remain outside `@media print` to prevent browser URL/timestamp injection.
   - Each template owns its inner padding. Print resets apply only to the editor wrapper (`.print-shell`), never to template `<main>` elements.
   - Hide interactive chrome using the `.no-print` utility class.

4. **AI Route Handler (`src/app/api/ai/route.ts`)**:
   - Uses `gemini-3.8-flash` with fallback to `gemini-3.1-flash-lite` (retry on 500/503, switch model on 404/429), or OpenRouter when `AI_PROVIDER=openrouter`.
   - Native document parsing uses Gemini `inlineData` with Base64 payloads rather than browser-side plain-text reading.
   - JSON actions request structured output (`responseMimeType: 'application/json'` via the `jsonMode` option); results are cleaned with `extractCleanJson` and, on the client, `normalizeResumeData`.
   - Browser code calls the route only through `callAi()` in `src/utils/aiClient.ts`.

---

## Coding Conventions

- **TypeScript**: Strict type definitions; avoid `any` wherever possible.
- **Icons**: Always import from `lucide-react`.
- **CSS / UI**: Tailwind CSS utility classes; avoid inline styles except for dynamic `accentColor` bindings.
- **File Structure**: Keep modular template components inside `preview/`, form steps inside `wizard/`, and home page sections inside `home/` (one file per section, composed in `StudioLanding.tsx`).
- **Home page previews**: use the made-up `landingDemoResume` (example.com contacts), never a real person's data. Wrap motion in the page's `MotionConfig reducedMotion="user"` and add `motion-reduce:animate-none` to CSS loops.
- **Documentation**: Project docs live in `doc/` (problem, approaches, design system, flowcharts, directory map). Update them when behavior changes.
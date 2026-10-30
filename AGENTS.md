# AI Assistant & Autonomous Agent Instructions

Operational guidelines and constraints for autonomous agents modifying or expanding the **AI Resume Studio** repository. The product spec is `doc/PRD.md` (v2.0); the architecture is explained in `doc/02-APPROACHES.md`.

---

## Core Operational Rules

1. **Never lose or overwrite user data**:
   - Resumes live in IndexedDB (`ai-resume-studio`, tables `resumes`, `versions`, `meta`) and are reached only through the storage service in `src/lib/storage/resumeRepository.ts`. Components never touch IndexedDB or `localStorage` for resume data.
   - All edits go through actions on `src/store/useWorkspaceStore.ts`. Never call `useWorkspaceStore.setState` with a copied resume from a component.
   - Creating a resume (blank, PDF import, example, copy, tailored version) always creates a **new record with a new ID**. Nothing may replace an existing resume without an explicit user choice.
   - Saves pass `expectedUpdatedAt`; a `ResumeConflictError` must surface as a conflict, never be ignored or retried blindly.
   - Save a version (`checkpoint`) before any bulk change (AI polish, GitHub import, restore).
   - The only other browser keys are `ai-resume-studio:preferences` (settings) and `ai-resume-studio:unsaved-changes` (journal). The legacy keys `ai-resume-builder-store` and `ai_resume_studio_store` are read once for migration only.
   - If the stored shape changes, bump `RESUME_SCHEMA_VERSION` and repair old data in `coerceResumeRecord` / `coerceResumeData`.

2. **Verify State Parity on Type Changes**:
   - If a field is added to `src/types/resume.ts`, you MUST also update:
     - `src/utils/normalizeResumeData.ts` (both `normalizeResumeData` and `coerceResumeData`) and `src/utils/resumeContent.ts` (`isFilled*` checks)
     - `src/lib/resume/record.ts` (`createBlankResumeData`) and, for a new section, `src/lib/resume/sections.ts` and `src/lib/resume/sectionContent.ts`
     - the editor in `src/components/workspace/editors/`
     - `src/components/preview/AllTemplates.tsx` (the shared `DynamicSectionsRenderer` used by all 11 templates)
     - `src/lib/resume/analyzer.ts` if the field affects readiness
     - the `parse-resume-pdf` schema in `src/app/api/ai/route.ts`
     - `src/types/initialResumeData.ts` and `src/components/home/landingDemoResume.ts` where useful
   - New templates and accent colors are registered in `src/components/preview/templateCatalog.tsx` only. Templates stay pure: props in (`data`, `accentColor`, `sectionOrder`), no store access.

3. **Strict Print Safety Protocol**:
   - Never remove or override `@page { margin: 0; }` in `src/app/globals.css`, and keep it outside `@media print`.
   - Never add non-printable interactive elements without the `no-print` class.
   - Keep the `#printable-resume-canvas` wrapper in `ResumeCanvasContainer.tsx`; `src/utils/exportPdf.ts` and `printRecord.tsx` depend on it. Template roots keep the `resume-page` class.

4. **AI Guardrails**:
   - Browser code calls the AI only through `callAi()` in `src/utils/aiClient.ts`. Every new action needs an entry in `ACTION_FEATURES`.
   - Never weaken the evidence-only rules: AI may rephrase existing content but must not add skills, metrics, employers, dates, or credentials. When information is missing, ask for it in `notes`.
   - Never apply AI output automatically. Show it in `SuggestionReview` (or a per-change review) and apply only on Accept.
   - Keep retry on HTTP 500/503 and model fallback on 404/429. Clean JSON with `extractCleanJson` on the server and `normalizeResumeData` on the client.
   - Keep the rate limit, body-size limit, and feature check in front of every action. Never log resume text or personal data.

5. **UI and Accessibility**:
   - Use the design tokens in `globals.css` (`bg-primary`, `text-ink-2`, `border-line`, `text-body`, …), Inter, and Lucide icons only. No heavy gradients, glass, or glow (PRD §5).
   - Use the components in `src/components/ui/` (`Button`, `Field`, `Dialog`, `ConfirmDialog`, `Menu`, `toast`). Merge classes with `cn()`.
   - Every input has a label, every icon-only button an `aria-label`, and every dialog closes with Esc. Respect reduced motion.
   - No sideways scrolling at 320 px and up.
   - Home page previews use only `landingDemoResume` (example.com), never real personal data.

6. **Verification Before Hand-off** — all must pass:
   - `npx tsc --noEmit`
   - `npm run lint`
   - `npm test` (Vitest unit tests)
   - `npm run build`
   - `npm run test:e2e` (Playwright; needs a build, mocks all AI calls)

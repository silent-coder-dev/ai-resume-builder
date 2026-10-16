# AI Assistant & Autonomous Agent Instructions

Operational guidelines and constraints for autonomous agents modifying or expanding the **AI Resume Studio** repository.

---

## Core Operational Rules

1. **Verify State Parity on Type Changes**:
   - If a field is added to `src/types/resume.ts`, you MUST simultaneously update:
     - `src/store/useResumeStore.ts` (store interface, actions, `createBlankResume`, and the persist `merge` defaults)
     - `src/types/initialResumeData.ts` (sample profiles and `emptyResumeData`)
     - `src/utils/normalizeResumeData.ts` (AI output cleanup) and `src/utils/resumeContent.ts` (`isFilled*` checks)
     - `src/components/wizard/FormWizard.tsx` (wizard form inputs)
     - `src/components/preview/AllTemplates.tsx` (the shared `DynamicSectionsRenderer` used by all 11 templates)
     - `src/components/home/landingDemoResume.ts` (the home page demo profile)
   - New templates are registered in `src/components/preview/templateCatalog.tsx` only; the editor and the home page gallery read from it.

2. **Strict Print Safety Protocol**:
   - Never remove or override `@page { margin: 0; }` in `src/app/globals.css`, and keep it outside `@media print`.
   - Never add non-printable interactive elements without appending the `no-print` class.
   - Keep the `#printable-resume-canvas` wrapper in `ResumeCanvasContainer.tsx`; `src/utils/exportPdf.ts` depends on it.

3. **Gemini API Error & Fallback Guardrails**:
   - Always ensure API requests include error boundaries and exponential backoff retries on HTTP 500/503, and switch to the fallback model on 404/429.
   - If changing prompt schemas, ensure JSON output structures match the expected state fields of `ResumeData`.
   - Never weaken the evidence-only rules: AI may rephrase existing content but must not add skills, metrics, employers, dates, or credentials.

4. **Component Modification Checklist**:
   - Do not use client-side storage keys other than `ai-resume-builder-store`.
   - Preserve framer-motion layout transitions when modifying wizard tab steps or template switching logic.
   - Any action that replaces the user's draft (sample profile, PDF import, start fresh, JD sync) must ask for confirmation first.

5. **Verification Before Hand-off**:
   - `npx tsc --noEmit`, `npm run lint`, and `npm run build` must all pass.

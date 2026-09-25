# AI Assistant & Autonomous Agent Instructions

Operational guidelines and constraints for autonomous agents modifying or expanding the **AI Resume Studio** repository.

---

## Core Operational Rules

1. **Verify State Parity on Type Changes**:
   - If a field is added to `src/types/resume.ts`, you MUST simultaneously update:
     - `src/store/useResumeStore.ts` (store interface, state setters, and defaults)
     - `src/types/initialResumeData.ts` (sample profiles and `emptyResumeData`)
     - `src/components/wizard/FormWizard.tsx` (wizard form inputs)
     - `src/components/preview/AllTemplates.tsx` (all 11 template renderers)

2. **Strict Print Safety Protocol**:
   - Never remove or override `@page { margin: 0; }` in `src/app/globals.css`.
   - Never add non-printable interactive elements without appending the `no-print` class.
   - Ensure all resume template wrappers retain `id="resume-preview"` to avoid breaking PDF export layouts.

3. **Gemini API Error & Fallback Guardrails**:
   - Always ensure API requests include error boundaries and exponential backoff retry loops on HTTP 503 (high concurrency).
   - If changing prompt schemas, ensure JSON output structures match the expected state fields of `ResumeData`.

4. **Component Modification Checklist**:
   - Do not use client-side storage keys other than `ai-resume-builder-store`.
   - Preserve framer-motion layout transitions when modifying wizard tab steps or template switching logic.
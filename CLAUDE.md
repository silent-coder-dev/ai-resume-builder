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
   - Single Zustand store holding `resumeData`, `activeStep`, `selectedTemplate`, and `accentColor`.
   - Persisted to browser storage under `ai-resume-builder-store`.
   - All state mutations must occur via explicit store actions.

2. **Template Architecture (`src/components/preview/AllTemplates.tsx`)**:
   - Every template receives `{ data: ResumeData; accentColor?: string }`.
   - Must use `#resume-preview` ID on root element for print styles.
   - Proficiencies (`Beginner`, `Intermediate`, `Professional`) guide AI prompts but are omitted from rendered resume skill pills.
   - Optional sections (`certifications`, `achievements`) must not render empty containers when omitted.

3. **Print Engine Rules (`src/app/globals.css`)**:
   - `@page { margin: 0; size: A4 portrait; }` must remain outside `@media print` to prevent browser URL/timestamp injection.
   - Spacing is handled internally via `#resume-preview { padding: 16mm 18mm !important; }`.
   - Hide interactive chrome using the `.no-print` utility class.

4. **AI Route Handler (`src/app/api/ai/route.ts`)**:
   - Uses `gemini-3.8-flash` with fallback to `gemini-3.1-flash-lite`.
   - Native document parsing uses Gemini `inlineData` with Base64 payloads rather than browser-side plain-text reading.
   - Enforce structured output via `generationConfig: { responseMimeType: 'application/json' }`.

---

## Coding Conventions

- **TypeScript**: Strict type definitions; avoid `any` wherever possible.
- **Icons**: Always import from `lucide-react`.
- **CSS / UI**: Tailwind CSS utility classes; avoid inline styles except for dynamic `accentColor` bindings.
- **File Structure**: Keep modular template components inside `preview/` and form steps inside `wizard/`.
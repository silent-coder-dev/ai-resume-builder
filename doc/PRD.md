# AI RESUME STUDIO

## PRODUCT REQUIREMENTS DOCUMENT (PRD)

- Version: 2.0
- Product: AI Resume Studio
- Document Type: Master Product Requirements Document
- Platform: Responsive Web Application
- Launch Model: Completely Free
- Authentication: No Mandatory Signup
- Architecture: Local-first, Monetization-ready
- Status: Development Specification

---

## 1. PRODUCT VISION

AI Resume Studio is a free-first, AI-powered resume creation and career preparation platform.

The platform helps students, fresh graduates and experienced professionals create professional resumes, improve their content, analyze job descriptions, import GitHub projects and prepare for interviews.

The product should feel like a polished professional SaaS application.

It must not feel like a generic AI-generated website or a simple wrapper around an AI API.

#### Core philosophy

> "AI should improve your story, never invent your achievements."

The user should always remain in control of their resume, personal information and AI-generated suggestions.

#### Primary objectives

- Create professional resumes without requiring signup.
- Make resume creation especially easy for freshers.
- Provide intelligent AI writing assistance.
- Provide explainable resume quality analysis.
- Support job-specific resume tailoring.
- Import real projects from GitHub.
- Provide interview preparation tools.
- Protect resume data from accidental loss.
- Keep the product free during the initial launch.
- Support future monetization without requiring a complete rewrite.

---

## 2. BUSINESS MODEL AND ACCESS POLICY

### 2.1 Launch policy

At launch, the application must be completely free.

Mandatory requirements:

- No mandatory signup.
- No mandatory login.
- No subscription.
- No payment gateway.
- No paywall.
- No locked resume templates.
- No payment required for PDF downloads.
- No account required to create or edit a resume.

All core resume-building features should be accessible immediately.

### 2.2 AI usage

AI features may have reasonable usage limits to protect API costs.

Requirements:

- Usage limits must be configurable.
- Limits must be communicated transparently.
- Users must receive a clear message when a limit is reached.
- Never charge users automatically.
- Never silently disable functionality.
- Avoid exposing AI provider API keys in frontend code.

The product must not advertise unlimited AI usage unless the infrastructure genuinely supports it.

### 2.3 Future monetization

The architecture should support future monetization.

Potential future model:

**Free plan**

- Resume creation.
- Standard templates.
- PDF export.
- Basic resume analysis.
- Limited AI assistance.

**Pro plan (future)**

- Higher AI usage.
- Advanced resume analysis.
- Multiple advanced resume versions.
- Advanced career tools.
- Additional premium functionality.

Important:

Do not introduce payment screens, pricing banners or artificial restrictions during the initial free launch.

Build configurable feature entitlements, but keep all launch features free.

---

## 3. TARGET AUDIENCE

#### Persona A: Fresher

- Recently graduated.
- Has no professional experience.
- Has academic and personal projects.
- Wants to apply for internships and entry-level positions.
- Needs help writing professional project descriptions.

#### Persona B: Student

- Currently studying.
- Has academic achievements and certifications.
- Wants to build an internship-ready resume.

#### Persona C: Experienced Professional

- Has previous employment.
- Wants to improve an existing resume.
- Wants role-specific resume versions.

#### Persona D: Developer

- Has GitHub repositories.
- Wants to showcase technical projects.
- Wants to generate evidence-based project descriptions.

---

## 4. PRODUCT INFORMATION ARCHITECTURE

Main application sections:

- Home
- Resume Builder
- My Resumes
- AI Resume Analyzer
- Job Matcher
- GitHub Project Import
- Interview Preparation
- Settings
- Privacy and Data Management

The navigation must remain simple and intuitive.

No authentication wall should appear when a user enters the application.

---

## 5. DESIGN SYSTEM

### 5.1 Visual direction

The design must feel:

- Minimal.
- Professional.
- Modern.
- Trustworthy.
- Premium.
- Fast.
- Accessible.

Visual inspiration:

- Linear
- Notion
- Stripe Dashboard
- Vercel Dashboard

Use these products as design-quality references, not as interfaces to copy.

Avoid generic AI landing-page aesthetics.

Avoid excessive gradients, glassmorphism, glowing cards and unnecessary animations.

### 5.2 Typography

Primary font: Inter.

Use Inter throughout the application UI.

Suggested hierarchy:

| Element | Size | Weight |
|---|---|---|
| Landing hero | 48px | 700 |
| Page title | 28px | 700 |
| Section heading | 22px | 600 |
| Card heading | 16px | 600 |
| Body | 14px | 400 |
| Secondary text | 13px | 400 |
| Labels | 12px | 500 |
| Buttons | 14px | 600 |

Use appropriate line heights.

Resume templates may support additional professional fonts.

All fonts used in exported resumes must render correctly in PDF.

### 5.3 Color palette

**Primary:**

- Primary: #4F46E5
- Primary Hover: #4338CA
- Primary Light: #EEF2FF

**Background:**

- Main Background: #F8FAFC
- Surface: #FFFFFF
- Secondary Surface: #F1F5F9

**Text:**

- Primary: #0F172A
- Secondary: #64748B
- Muted: #94A3B8

**Borders:**

- Default: #E2E8F0
- Strong: #CBD5E1

**Status:**

- Success: #16A34A
- Warning: #D97706
- Error: #DC2626
- Information: #2563EB

Use semantic colors consistently.

### 5.4 Spacing

Use a 4px spacing system.

- 4px: Tiny
- 8px: Compact
- 12px: Small
- 16px: Standard
- 24px: Section
- 32px: Large
- 48px: Extra large
- 64px: Major section

### 5.5 Border radius

- Inputs: 8px.
- Buttons: 8px.
- Cards: 12px.
- Dialogs: 16px.
- Large panels: 16px.

### 5.6 Shadows

Prefer subtle borders over heavy shadows.

Avoid excessive elevation.

### 5.7 Icons

Use Lucide icons consistently.

Do not mix multiple icon libraries.

All icons should have consistent sizes and stroke weights.

### 5.8 Animations

- Hover transitions: 150ms.
- Dialog transitions: 180ms.
- Navigation transitions: 200ms.

Use skeleton loading states.

Respect reduced-motion preferences.

---

## 6. RESPONSIVE DESIGN

Supported viewport sizes:

- Mobile: 320px–767px.
- Tablet: 768px–1023px.
- Desktop: 1024px and above.

**Desktop:**

- Persistent left navigation.
- Main content area.
- Optional right preview panel.

**Tablet:**

- Collapsible sidebar.
- Flexible layouts.

**Mobile:**

- Compact navigation.
- Single-column forms.
- Separate editor and preview tabs.
- Touch-friendly buttons.
- No horizontal overflow.

All major workflows must be usable on mobile.

---

## 7. LANDING PAGE

### 7.1 Header

Logo: AI Resume Studio.

Navigation:

- Features.
- Templates.
- How It Works.
- About.

Actions:

- Open Resume Studio.
- Create Resume.

Do not require signup.

### 7.2 Hero

Headline:

> "Build a Resume That Gets You Noticed."

Subheadline:

> "Create professional, ATS-friendly resumes with AI-powered writing assistance, real project insights and job-specific recommendations."

Primary CTA: "Build My Resume"

Secondary CTA: "Explore Templates"

Show an actual resume editor preview.

Do not use fabricated testimonials, fake statistics or invented user counts.

### 7.3 Features

Showcase:

- AI Resume Writing.
- ATS Readiness Analysis.
- Job Description Matching.
- GitHub Project Import.
- Professional Templates.
- Free PDF Export.

### 7.4 How it works

1. Create or import your resume.
2. Improve content using AI.
3. Analyze resume quality.
4. Match against job descriptions.
5. Export your resume.

### 7.5 Privacy section

Explain clearly:

- No account required.
- How local browser storage works.
- What information is sent to AI services.
- How users can delete their data.
- Limitations of browser storage.

Do not claim that all data remains on the device if any information is sent to external AI providers.

---

## 8. NO-SIGNUP USER EXPERIENCE

This is a core product requirement.

Users should be able to use the application immediately.

#### First visit flow

1. User opens the website.
2. Landing page appears.
3. User clicks "Build My Resume".
4. User enters the resume workspace.
5. User chooses how to start:
   - Create a new resume.
   - Import an existing PDF.
   - Start with a template.

No signup dialog should appear.

#### Returning user flow

When a user revisits the application:

1. Detect existing locally saved resume data.
2. Load the last available workspace.
3. Show a clear resume selection option if multiple resumes exist.
4. Restore the previous editing state.
5. Allow the user to continue without signing in.

Local persistence must not depend on an account.

---

## 9. CRITICAL FEATURE: RESUME DATA SAFETY

**Priority: P0 — Must implement before launch.**

This feature prevents accidental data loss.

The user must never lose a resume simply because they refresh the page, press Back or navigate away accidentally.

### 9.1 Automatic saving

All resume edits must be saved automatically.

Save triggers:

- Text changes.
- Section additions.
- Section deletion.
- Section reordering.
- Template changes.
- Personal information updates.
- AI suggestion acceptance.
- Project imports.

Use debounced autosave for text inputs.

Do not save every keystroke immediately.

### 9.2 Save status

Show a visible save indicator.

Possible states:

- Saving...
- All changes saved.
- Offline.
- Save failed.
- Recovering previous changes.

Use clear and understandable status text.

### 9.3 Local persistence

For the no-login experience:

- Use IndexedDB for structured resume storage.
- Use localStorage only for small preferences or lightweight metadata.
- Use appropriate browser storage APIs through a well-defined storage abstraction.
- Avoid relying on temporary component state for persistent resume data.

Each resume must have:

- Unique ID.
- Title.
- Creation timestamp.
- Last modified timestamp.
- Resume content.
- Selected template.
- Career stage.
- Schema version.

### 9.4 Browser refresh behaviour

Scenario:

User is editing Resume A.

User refreshes the page.

Expected result:

1. Application initializes.
2. Previously saved resume data is retrieved.
3. The last edited resume is restored.
4. The editor reopens with previous content.
5. A confirmation or warning is not required when no unsaved work exists.

Never create a blank resume automatically just because the page refreshed.

### 9.5 Browser Back behaviour

Scenario:

User is editing a resume and accidentally presses Back.

Expected behaviour:

- Previously saved changes remain safe.
- The application should not silently discard data.
- If unsaved changes are pending, attempt to save them first.
- Use a navigation warning where supported and appropriate.
- Provide a clear way to return to the existing resume.

Do not abuse browser navigation interception.

Do not show unnecessary confirmation dialogs for already-saved work.

### 9.6 Recovery system

Implement:

- Autosave.
- Last saved timestamp.
- Recovery of the most recent saved version.
- Protection against interrupted saves.
- Storage error handling.
- Optional recent-version recovery.

If storage becomes unavailable or full, inform the user.

Do not falsely display "Saved" when persistence has failed.

### 9.7 Multiple resumes

Users must be able to create and manage multiple resumes.

Example:

- Java Developer Resume.
- Full Stack Developer Resume.
- Python Developer Resume.
- Internship Resume.

Each resume must be independent.

Editing one resume must never accidentally overwrite another.

---

## 10. CRITICAL FEATURE: NEW RESUME CONFIRMATION

**Priority: P0 — Must implement before launch.**

This is one of the most important UX flows.

Whenever a user tries to create a new resume while an existing resume is available, the application must clearly ask what they want to do.

#### Trigger locations

- Create New Resume button.
- Resume Builder entry point.
- Dashboard new resume action.
- Any workflow that creates a fresh resume.

Do not trigger this dialog merely because the user refreshes or revisits the application.

#### Required dialog

Title:

> "What would you like to do?"

Description:

> "You already have an existing resume. Would you like to continue editing it or create a new one?"

Actions:

- Continue Existing Resume.
- Create New Resume.
- Cancel.

#### Action 1: Continue Existing Resume

- Open the last edited resume or show resume selection if multiple exist.
- Preserve all existing content.
- Restore the saved template.
- Restore the last editing state where possible.

#### Action 2: Create New Resume

Before creating:

- Ask for a resume name.
- Optionally ask career stage.
- Create a new independent resume ID.
- Do not copy over the previous resume unless the user explicitly chooses a duplicate option.
- Do not delete or modify the old resume.

Example:

User already has: "Java Developer Resume"

User clicks: "Create New Resume"

Dialog:

```text
"What would you like to do?"

[Continue Java Developer Resume]

[Create a New Resume]

[Cancel]
```

If the user chooses new:

Resume name: "Full Stack Developer Resume"

Then create a separate resume.

#### Action 3: Cancel

Close the dialog.

Keep the user on the current screen.

Do not change any resume data.

#### Acceptance criteria

- Existing resume must never be overwritten silently.
- New resume must receive a new unique ID.
- Existing resume remains available after creating another.
- Refresh must not trigger the new-resume dialog.
- Back navigation must not trigger accidental new-resume creation.
- Resume selection must be deterministic.

---

## 11. RESUME WORKSPACE

#### Layout

**Desktop layout:**

Left:

- Resume sections navigation.

Center:

- Editing forms.

Right:

- Live A4 document preview.

Top toolbar:

- Resume name.
- Save status.
- Undo.
- Redo.
- Template selector.
- Download PDF.

**Mobile:**

- Editor tab.
- Preview tab.
- Compact toolbar.

#### Resume sections

- Personal Information.
- Professional Summary.
- Education.
- Work Experience.
- Projects.
- Technical Skills.
- Certifications.
- Achievements.
- Internships.
- Languages.
- Custom Sections.

Support:

- Add.
- Edit.
- Delete.
- Reorder.
- Hide optional sections.

#### Personal information fields

- Full name.
- Email.
- Phone.
- Location.
- LinkedIn URL.
- GitHub URL.
- Portfolio URL.

Validate inputs.

Never require unnecessary personal information.

---

## 12. FRESHER MODE

**Priority: P1**

When a user selects Fresher:

- Education becomes prominent.
- Projects become prominent.
- Technical skills receive priority.
- Internships are optional.
- Certifications are optional.
- Achievements are supported.
- Work experience is optional.

Do not penalize freshers for not having employment history.

Offer project-focused resume suggestions.

---

## 13. AI WRITING ASSISTANT

Provide contextual AI actions:

- Improve Writing.
- Make Concise.
- Make Professional.
- Fix Grammar.
- Improve Clarity.
- Rewrite as Achievement.
- Add Relevant Keywords.

#### AI approval flow

1. User requests an improvement.
2. AI generates a suggestion.
3. Original and suggested content are displayed.
4. User can accept, edit or reject.
5. Only accepted content updates the resume.

AI must never automatically overwrite the user's original content.

#### Accuracy requirements

Never fabricate:

- Skills.
- Metrics.
- Certifications.
- Employment.
- Degrees.
- Project outcomes.
- Company names.
- Dates.

When necessary, ask the user for additional information.

---

## 14. RESUME TEMPLATES

Maintain existing templates where possible.

All templates must support:

- A4 dimensions.
- Readable typography.
- Consistent margins.
- ATS-friendly structure.
- Correct PDF output.
- Multi-page resumes.
- Long content.
- Clickable links where supported.

Provide a preview before selection.

All launch templates should remain free.

Avoid decorative elements that interfere with readability.

---

## 15. GITHUB PROJECT IMPORT

**Priority: P1 — Main product differentiator.**

#### User journey

1. Open GitHub Projects.
2. Enter GitHub username.
3. Fetch public repositories using the official API.
4. Display repository list.
5. Select desired projects.
6. Analyze repository metadata and approved content.
7. Generate an editable project description.
8. Review the information.
9. Add selected project to resume.

#### Information to extract

- Repository name.
- Description.
- Programming languages.
- Topics.
- README information.
- Repository URL.

Never execute imported repository code.

Never fabricate features, results or performance metrics.

Respect API limits.

---

## 16. AI RESUME ANALYZER

Analyze:

- Resume completeness.
- Grammar.
- Formatting.
- Skills.
- Projects.
- Experience.
- Contact details.
- Role relevance.

Display:

- Readiness estimate.
- Issues found.
- Severity.
- Explanation.
- Suggested improvement.
- Fix action.

Scores must be explainable.

Do not guarantee ATS compatibility or interview selection.

---

## 17. JOB DESCRIPTION MATCHER

User flow:

1. Paste job description.
2. Select resume.
3. Analyze both.
4. Display relevant and missing skills.
5. Show project alignment.
6. Show keyword gaps.
7. Suggest improvements.
8. Allow creation of a separate tailored resume version.

Never overwrite the original resume.

A match score must be described as an estimate, not a hiring probability.

---

## 18. INTERVIEW PREPARATION

Allow users to generate questions from:

- Resume.
- Technical skills.
- Projects.
- Target role.

Question categories:

- Technical.
- Project-based.
- Behavioral.
- Role-specific.

Provide feedback on:

- Accuracy.
- Clarity.
- Completeness.
- Communication.

Allow users to retry questions.

Do not claim AI feedback guarantees interview success.

---

## 19. MY RESUMES

Display all available resumes.

Each resume card should contain:

- Resume name.
- Target role.
- Last modified date.
- Selected template.
- Preview.

Actions:

- Open.
- Rename.
- Duplicate.
- Download.
- Delete.

Deletion must require confirmation.

Deleting one resume must never delete other resumes.

Provide a clear empty state for users who have not created a resume.

---

## 20. DATA STORAGE AND PRIVACY

#### Launch storage architecture

The application should support anonymous local-first usage.

Use IndexedDB for resume content and multiple resume records.

Use localStorage only for lightweight preferences.

Do not require an account for local resume creation.

#### Storage abstraction

Create a storage service that separates UI logic from storage implementation.

Suggested interface:

```ts
createResume()
getResume()
getAllResumes()
updateResume()
deleteResume()
duplicateResume()
getLastEditedResume()
setLastEditedResume()
```

This abstraction should allow future migration to cloud storage.

#### Important limitations

Browser data may be lost if users clear browser storage, use private browsing or change devices.

Communicate this clearly.

Offer:

- Downloadable PDF.
- Resume JSON export.
- Resume JSON import.

Future cloud backup may be added as an optional feature.

#### Privacy

Explain what data is sent to AI providers.

Do not transmit unnecessary personal data.

Never expose secret keys.

---

## 21. FREE-FIRST, MONETIZATION-READY ARCHITECTURE

At launch:

- All core features free.
- No account requirement.
- No payment integration.
- No premium locks.
- No subscription prompts.

Future architecture should support:

- Feature entitlements.
- Usage limits.
- AI quotas.
- Optional user accounts.
- Cloud synchronization.
- Subscription management.

Do not implement a complex billing system now.

Use configurable feature policies.

The free launch must remain genuinely useful.

---

## 22. TECHNICAL ARCHITECTURE

First inspect the existing repository.

Expected technologies based on the current project:

- React.
- TypeScript.
- Existing styling system.
- Zustand.
- Existing AI API routes.
- Existing PDF generation implementation.
- Vercel deployment.

Preserve the existing architecture unless a technical issue justifies changing it.

Do not rewrite the entire project.

Do not introduce unnecessary dependencies.

Create clear separation between:

- UI components.
- Resume domain models.
- State management.
- Storage.
- AI services.
- API integrations.
- PDF generation.
- Validation utilities.

Use strict TypeScript.

Validate untrusted data at runtime.

---

## 23. SECURITY

Implement:

- Server-side validation.
- AI API rate limiting.
- Request size limits.
- Secure secret management.
- Safe PDF parsing.
- Input sanitization.
- GitHub API rate-limit handling.
- Safe error responses.
- Dependency scanning.

Never expose provider API keys.

Never execute imported repository code.

Do not log complete resumes or unnecessary personal information.

Local-first storage does not remove the need for API security.

---

## 24. PERFORMANCE

Requirements:

- Fast initial page rendering.
- Lazy loading where appropriate.
- Optimized resume preview.
- Efficient state updates.
- Debounced autosave.
- Minimal unnecessary AI requests.
- Graceful offline handling.
- Efficient PDF generation.

Avoid unnecessary rerenders while typing.

---

## 25. ACCESSIBILITY

Target WCAG 2.2 AA.

Requirements:

- Keyboard navigation.
- Visible focus states.
- Semantic HTML.
- Accessible forms.
- Screen reader support.
- Appropriate contrast.
- Accessible confirmation dialogs.
- Reduced-motion support.

All critical actions must be accessible without a mouse.

---

## 26. TESTING REQUIREMENTS

#### Resume persistence tests

1. Create a resume.
2. Add content.
3. Refresh the page.
4. Verify all content is restored.
5. Navigate Back.
6. Return to the application.
7. Verify the resume remains available.
8. Create another resume.
9. Verify the original remains unchanged.
10. Duplicate a resume.
11. Verify independent editing.
12. Delete one resume.
13. Verify other resumes remain available.

#### Critical scenario tests

**Scenario A:** User refreshes while editing.

Expected: Resume restores correctly.

**Scenario B:** User clicks Create New Resume while an existing resume exists.

Expected: Choice dialog appears.

**Scenario C:** User clicks Continue Existing Resume.

Expected: Existing resume opens without modification.

**Scenario D:** User clicks Create New Resume.

Expected: New independent resume is created.

**Scenario E:** User clicks Cancel.

Expected: No data changes.

**Scenario F:** User clears browser storage.

Expected: The application explains that local data is unavailable and offers import if the user has an exported backup.

#### Additional tests

- AI response validation.
- PDF export.
- GitHub import.
- ATS analysis.
- Job matching.
- Mobile layout.
- Security.
- Accessibility.

Use automated unit, integration and end-to-end tests.

---

## 27. IMPLEMENTATION PHASES

#### Phase 0: Repository audit

- Inspect current project.
- Understand existing architecture.
- Inventory existing features.
- Identify bugs.
- Review dependencies.
- Review existing storage implementation.
- Prepare migration plan.

Do not change the architecture before understanding it.

#### Phase 1: Critical data safety

- IndexedDB storage.
- Multiple resume support.
- Autosave.
- Recovery.
- Refresh persistence.
- Back navigation handling.
- New Resume confirmation.
- JSON export/import.

This phase has the highest priority.

#### Phase 2: Design system

- Typography.
- Colors.
- Spacing.
- Reusable components.
- Responsive layouts.
- Consistent dialogs.

#### Phase 3: Product UI

- Landing page.
- Dashboard.
- Resume workspace.
- My Resumes.
- Template selection.

#### Phase 4: AI improvements

- AI writing.
- Resume analyzer.
- Job matcher.
- Better validation.

#### Phase 5: Differentiating features

- GitHub import.
- Interview preparation.
- Multiple tailored resumes.

#### Phase 6: Production readiness

- Security.
- Rate limiting.
- Tests.
- Accessibility.
- Performance.
- Documentation.
- Deployment validation.

---

## 28. DEFINITION OF DONE

The project is ready for launch when:

- Users can access it without signing up.
- Core resume functionality is free.
- Existing resumes survive page refresh.
- Accidental Back navigation does not silently lose work.
- Creating a new resume prompts users when existing resumes are available.
- Existing resumes are never silently overwritten.
- Multiple resumes work independently.
- Resume import and export work.
- AI suggestions require user approval.
- PDF output is correct.
- Mobile experience works.
- Important flows have automated tests.
- Security checks are completed.
- The website communicates privacy and storage limitations honestly.
- Future monetization can be added without rewriting the application.

---

## 29. STRICT INSTRUCTIONS FOR AI CODING AGENTS

Any AI agent implementing this PRD must:

- Read the entire PRD before coding.
- Inspect the existing GitHub repository.
- Inspect the existing README.
- Inspect package.json and dependencies.
- Understand current state management.
- Understand existing storage and persistence.
- Identify all existing features.
- Preserve working functionality.
- Avoid unnecessary rewrites.
- Use the existing design conventions where appropriate.
- Implement changes in small phases.
- Test changes after implementation.
- Avoid fake data.
- Never fabricate successful test results.
- Never expose API keys.
- Never silently overwrite user data.
- Never introduce mandatory authentication.
- Never introduce payment requirements at launch.
- Document breaking changes.
- Update README when necessary.

Before implementation, produce:

- Repository audit.
- Current architecture.
- Existing feature inventory.
- Identified issues.
- Proposed file changes.
- Data migration plan.
- Implementation sequence.

Wait for approval before major architectural changes.

---

## FINAL PRODUCT PRINCIPLE

AI Resume Studio must be:

- Free to use at launch.
- Accessible without mandatory signup.
- Safe against accidental data loss.
- Useful for freshers and professionals.
- Honest about AI-generated content.
- Professional in appearance.
- Reliable in functionality.
- Ready for future growth.

> **The most important rule:** A user's resume is valuable personal work. Never lose it, never silently replace it, and always give the user control.

# 3. Design System — Fonts, Colors, Components, and Templates

> **Read time:** about 10 minutes
> **Before this:** [2. Approaches](./02-APPROACHES.md) · **Next:** [4. Flowcharts](./04-FLOWCHARTS.md)

This page lists every design choice in the website: the fonts, the colors, the sizes, the buttons, the animations, and all 11 resume templates. Use it as the single place to check *"how should this look?"*

---

## 1. Design principles

| Principle | What it means in practice |
|---|---|
| **Calm and clear** | Light backgrounds, soft borders, lots of white space. The resume is the hero, not the interface. |
| **Honest by design** | Words like *"estimate"*, *"not a hiring guarantee"*, and *"review before applying"* are part of the design. |
| **One main action per area** | Each card has one strong button. Other actions are quieter (outline or text buttons). |
| **Color means something** | Green = good / done. Amber = needs attention. Red = problem. Indigo/violet = AI. |
| **Print first for the resume** | The resume page is designed at true A4 size, so the screen and the PDF match exactly. |
| **Works on a phone** | Every screen works at 390 px wide with no sideways scrolling. |

---

## 2. Fonts

| Font | Where it is used | How it is loaded |
|---|---|---|
| **Geist Sans** | The whole website and all *sans-serif* resume templates | `next/font/google` in `src/app/layout.tsx`, mapped to Tailwind's `font-sans` in `globals.css` |
| **Geist Mono** | Small technical text: the project tech-stack line, link URL fields, the step counter (1/7), the zoom % | Same, mapped to `font-mono` |
| **System serif** (Georgia, Cambria, Times New Roman) | *Executive Serif* header and the whole *Legal / Academic* template | Tailwind `font-serif` (no download needed) |

Fallbacks: if Geist cannot load, the browser uses its own system sans font (`ui-sans-serif, system-ui, sans-serif`).

The fonts are also copied into the PDF print frame, so the downloaded PDF uses the same font as the preview.

### Type scale

**Website (interface)**

| Use | Size | Weight | Example |
|---|---|---|---|
| Hero headline | 36 → 60 px (`text-4xl` → `text-6xl`) | Black (900), tight letter spacing | *"Your experience deserves a better story."* |
| Section headline | 30 → 36 px (`text-3xl` / `text-4xl`) | Black (900) | *"Know how your resume meets the role."* |
| Card title | 14 px (`text-sm`) | Extra bold (800) | *"Your resume"* |
| Form label | 11 px | Bold (700) | *"Full Name"* |
| Body / input text | 12 px (`text-xs`) | Regular | Text inside inputs |
| Hint / helper | 9–10 px | Medium | *"Max 30,000"* |

**Resume page (inside the templates)**

| Use | Size | Style |
|---|---|---|
| Candidate name | 20–30 px | Bold to black; some templates use UPPERCASE |
| Target role | 12–14 px | Semibold; italic in serif templates |
| Section heading | 12 px | Bold, UPPERCASE, wide letter spacing, accent color, thin underline |
| Body text and bullets | 12 px | Regular, relaxed line height |
| Dates, tech stack, scores | 10–11 px | Semibold or mono, gray |

---

## 3. Colors

All colors come from Tailwind CSS's default palette, so they are consistent everywhere.

### 3.1 Brand colors

| Name | Tailwind | Hex | Used for |
|---|---|---|---|
| Indigo | `indigo-600` | `#4F46E5` | Main brand color, AI features, links on hover |
| Violet | `violet-600` | `#7C3AED` | Second brand color, gradients, "Optimize with AI" |
| Blue | `blue-600` | `#2563EB` | Active wizard tab, "Next" button, default resume accent |
| Sky | `sky-600` | `#0284C7` | Gradient end on the hero headline |

**Brand gradient:** `indigo-600 → violet-600` (logo tile, AI buttons). The favicon uses `#3B82F6 → #6366F1 → #8B5CF6`.

### 3.2 Neutral colors

| Name | Tailwind | Hex | Used for |
|---|---|---|---|
| Ink | `slate-950` | `#020617` | Main dark buttons ("Download PDF", "Start a new resume"), footer background |
| Heading text | `slate-900` | `#0F172A` | Titles and resume names |
| Body text | `slate-600` / `slate-700` | `#475569` / `#334155` | Paragraphs |
| Muted text | `slate-400` / `slate-500` | `#94A3B8` / `#64748B` | Hints, captions |
| Border | `slate-200` | `#E2E8F0` | Cards, inputs, dividers |
| Soft background | `slate-50` / `slate-100` | `#F8FAFC` / `#F1F5F9` | Inner panels, editor background |
| Home background | custom | `#F7F8FC` | Home page base color |

### 3.3 Status colors

| Meaning | Tailwind (bg / text) | Hex (main) | Example |
|---|---|---|---|
| ✅ Success / evidence found | `emerald-50` / `emerald-700` | `#047857` | "Evidence found", "Saved on this device", ATS ≥ 80 |
| ⚠️ Warning / needs attention | `amber-50` / `amber-700` | `#B45309` | "Review", "Needs Polish", ATS 50–79 |
| ❌ Error / required gap | `rose-50` / `rose-700` | `#BE123C` | Error messages, "Required gap", ATS < 50 |
| 🔷 Info | `blue-50` / `blue-900` | `#1E3A8A` | Tips, import entry |

> Status is never shown by color alone. There is always a word or an icon too ("Pass", "Review", ✓, ?).

### 3.4 Resume accent colors (user can choose)

These change the name, headings, and lines of the resume.

| Name | Hex | Feeling |
|---|---|---|
| Corporate Blue (default) | `#2563EB` | Trusted, modern |
| Executive Slate | `#0F172A` | Serious, senior |
| Emerald Green | `#059669` | Fresh, healthcare, sustainability |
| Royal Violet | `#7C3AED` | Creative, design |
| Warm Amber | `#D97706` | Friendly, education, sales |
| Crimson Red | `#DC2626` | Bold, attention-grabbing |
| Neutral Zinc | `#52525B` | Quiet, minimal |

Section heading underlines use the accent color at **25% opacity** (the hex code plus `40`), so they look soft, not heavy.

---

## 4. Shape, depth, and spacing

| Token | Value | Used for |
|---|---|---|
| Small radius | `rounded-lg` — 8 px | Small buttons, tags, list items |
| Medium radius | `rounded-xl` — 12 px | Inputs, main buttons, popovers |
| Large radius | `rounded-2xl` — 16 px | Cards, modals, wizard panel |
| Extra large | `rounded-3xl` — 24 px | Mobile bottom sheets, footer call-to-action card |
| Pill | `rounded-full` | Badges, zoom bar, page counter |
| Soft shadow | `shadow-2xs` / `shadow-xs` / `shadow-sm` | Buttons and cards at rest |
| Strong shadow | `shadow-xl` / `shadow-2xl` | Dropdowns, modals, hero card |
| Glass | `bg-white/95` + `backdrop-blur-md` | Sticky editor header, zoom bar |
| Spacing | 4 px base (Tailwind scale) | Cards use 16–24 px padding; page edges 12–32 px |

---

## 5. Icons

- **Library:** [Lucide React](https://lucide.dev) only. No other icon sets.
- **Sizes:** 12–14 px inside small buttons (`h-3 w-3` / `h-3.5 w-3.5`), 16 px in normal buttons (`h-4 w-4`), 20 px in feature tiles (`h-5 w-5`).
- **Common icons:**

| Icon | Meaning |
|---|---|
| ✨ `Sparkles` / `WandSparkles` | AI action |
| ⬇️ `Download` | Download PDF |
| ↕️ `ArrowUpDown` | Reorder sections |
| 🎯 `Target` | Job match |
| 📤 `Upload` / `FileUp` | Import a PDF |
| ✅ `CheckCircle2` | Success / evidence found |
| ❓ `CircleHelp` / ⚠️ `AlertCircle` | Needs review / error |
| 🗑️ `Trash2` | Remove an item |

---

## 6. Components

### Buttons

| Type | Look | Used for |
|---|---|---|
| **Primary (ink)** | `slate-950` background, white text | The single most important action on a light background: *Download PDF*, *Try the editor* |
| **Primary on dark (white)** | White background, dark text, indigo glow | The main action on a dark background: *Start a new resume*, *Open editor* |
| **AI (gradient)** | `indigo-600 → violet-600` gradient, white text | AI actions: *Generate with AI*, *Analyze resume match* |
| **Action (blue)** | `blue-600` background | Wizard *Next*, *Extract & Fill*, *Done* |
| **Secondary (outline)** | White, `slate-200` border | *Reorder*, *Templates*, *Match to a job* |
| **Soft** | Light tint (`blue-50`, `indigo-50`) with colored text | *Add Skill*, *+ Class 10* |
| **Text** | No background, colored text | *Use my notes instead*, *Open in editor* |

All buttons: rounded corners (8–16 px), bold small text, a hover color change, and a disabled state at 50% opacity.

### Inputs

- 12 px text, 8–10 px padding, `slate-200` border, 12 px radius.
- Focus: a 2 px blue or indigo ring.
- Every input has a label (visible or `aria-label`).

### Cards and panels

- White background, `slate-200` border, 16 px radius, soft shadow.
- Inner panels use `slate-50` with a lighter border.

### Badges

- Tiny (9–10 px), bold, uppercase, pill shaped.
- Examples: **FREE** (emerald), **ATS-READY** (emerald), **READY TO CREATE** / **ADD YOUR DETAILS** (emerald / amber).

### Alerts

- Error: `rose-50` background, `rose-200` border, `rose-700` text, `role="alert"`.
- Success: `emerald-50`, `emerald-200`, `emerald-800`, `role="status"`.
- Warning: `amber-50`, `amber-200`, `amber-900`.

### Modals and sheets

- Dark see-through backdrop (`slate-950/60`) with a light blur.
- Desktop: a centered card. Mobile: a **bottom sheet** that slides up.
- Every modal closes with the **Esc** key, the ✕ button, or a click outside.
- Modals use `role="dialog"` and `aria-modal="true"`.

---

## 7. Motion (animation)

Animations use **Framer Motion**. They are short and gentle, never slow the user down.

| Element | Animation | Timing |
|---|---|---|
| Buttons | Lift up 1–2 px on hover, shrink to 97–98% on tap | Instant |
| Wizard tabs | The blue pill **slides** to the active tab | Spring (stiffness 380, damping 30) |
| Template switch | Old page fades out, new page fades and slides in by 8 px | 0.18 s |
| Modals | Fade + grow from 95% to 100% | 0.2 s |
| Expanding panels | Height grows from 0 with a fade | Default |
| ATS ring | The circle fills to the new score | 0.8 s ease-out |
| AI Summary icon | Rotates while the summary is being written | Loops while loading |
| Home floating badge | Floats up and down by 7 px | 4 s loop |
| ATS score hits 100 | Confetti burst 🎉 | Once |
| **Home:** sections and cards | Fade in and rise 24 px the first time they scroll into view (`Reveal`) | 0.6 s |
| **Home:** hero resume | Tilts in 3D toward the mouse pointer (spring) | Follows the pointer |
| **Home:** aurora glow | Three blurred color blobs drift slowly behind the hero | 24–28 s loops |
| **Home:** "better story." | A light shimmer sweeps across the gradient text (`animate-shine`) | 7 s loop |
| **Home:** role ticker | Career names scroll sideways forever (`animate-marquee`) | 38 s loop |
| **Home:** numbers and rings | Count up from 0 and fill their ring when first seen (`CountUp`, `ScoreRing`) | 1.4–1.6 s |
| **Home:** feature cards | A soft light follows the cursor across the card (`SpotlightCard`) | Follows the pointer |

Loading states always use a spinning `Loader2` / `LoaderCircle` icon **plus** a short text, like *"Reading your PDF…"* or *"Tailoring honestly…"*.

**Reduced motion:** the home page is wrapped in `<MotionConfig reducedMotion="user">`, the CSS loops use `motion-reduce:animate-none`, and smooth scrolling is turned off. People who ask their system for less motion get a calm, still page.

---

## 8. Layout and responsive rules

| Screen | Breakpoint | Layout |
|---|---|---|
| Phone | under 640 px | One column. Editor and preview are two tabs. Icon-only header buttons. |
| Tablet | 640 – 1023 px | One column, wider cards, some labels return. |
| Desktop | 1024 px and up (`lg`) | Two columns: form on the left (5/12), live preview on the right (7/12). Full header toolbar. |

- Maximum page width: **1700 px** (editor), **1280 px** (home page).
- The editor header is **sticky**. On phones, the Edit/Preview switcher sticks right under it.
- The zoom bar floats at the bottom right of the preview.

---

## 9. The resume page

| Property | Value |
|---|---|
| Page size | A4 portrait — **794 × 1123 px** at 96 DPI (210 × 297 mm) |
| Page margin in print | 0 (each template has its own inner padding: 24–40 px) |
| Section heading | 12 px, bold, uppercase, wide spacing, accent color, thin accent underline |
| Skills | Small gray pills with a light border |
| Experience | Role (bold) + dates (right side) + company + bullet list |
| Projects | Title (bold) + tech stack in mono (right side) + description |
| Education | Degree (bold) + institution • field + year and score (right side) |
| Empty sections | Not drawn at all |
| Links | Shown as clickable words (for example *LinkedIn*), underlined |

---

## 10. The 11 templates

Every template uses the same sections and the same section order. Only the **header and page frame** change.

| # | Template (ID) | Look | Font | How the accent color is used | Best for |
|---|---|---|---|---|---|
| 0 | **Blank Canvas** (`blank`) | Very plain, simple underline | Sans | Section headings only | Starting out, maximum simplicity |
| 1 | **Modern Tech** (`modern`) — *default* | Name in accent color, contact icons, thick accent rule | Sans | Name + header line + headings | Software, IT, startups |
| 2 | **Executive Serif** (`classic`) | Centered UPPERCASE serif name, italic title | Serif header, sans body | Header line + headings | Managers, senior roles |
| 3 | **Creative Sidebar** (`sidebar`) | Dark slate side column with name, contact, and profiles | Sans | Headings in the main column | Designers, portfolios |
| 4 | **Compact Grid** (`compact`) | Tight spacing, contact on the right | Sans | Name + header line + headings | Long resumes that must fit one page |
| 5 | **Pure Minimal** (`minimal`) | Light-weight name, spaced-out title, lots of white space | Sans | Headings only | Clean, quiet look |
| 6 | **Corporate Banner** (`corporate`) | Full-width colored banner at the top with white text | Sans | Whole banner + headings | Business, consulting, sales |
| 7 | **Career Timeline** (`timeline`) | Thick accent bar on the left of the header, thin line down the page | Sans | Side bar + headings | Showing a clear career path |
| 8 | **Legal / Academic** (`academic`) | "Curriculum Vitae", centered serif, strong black rule | Serif | Headings only | Law, research, teaching |
| 9 | **Bold Designer** (`creative`) | Huge UPPERCASE name, thick accent bottom border | Sans | Title + bottom border + headings | Creative and marketing roles |
| 10 | **Clinical Healthcare** (`medical`) | Soft gray header box, teal title | Sans | Headings (title stays teal) | Doctors, nurses, healthcare |

**Shared rules for all templates:**

- Same A4 size and the same `#printable-resume-canvas` print wrapper.
- Placeholder text ("Your Name", "Professional Title") shows faded in the preview only. It is never printed.
- No watermark or branding is ever printed on the user's resume.

---

## 11. Writing style (UI text)

| Rule | Good example | Avoid |
|---|---|---|
| Simple, friendly words | *"Add your work notes before enhancing them."* | *"rawDetails is required."* |
| Honest about AI | *"Review every change before using it."* | *"Perfect resume guaranteed!"* |
| Say what happens next | *"Importing replaces the resume that is open in the editor now."* | Silent overwrites |
| Short loading text | *"Reading your PDF…"* | Spinners with no text |
| Tell the fix, not just the error | *"Enter a four-digit year to continue."* | *"Invalid input."* |

---

## 12. Accessibility checklist

- ✅ Every icon-only button has an `aria-label` (for example *"Remove this project"*, *"Zoom in"*).
- ✅ Form inputs have labels.
- ✅ Visible focus rings (`focus-visible:ring-2`) for keyboard users.
- ✅ Modals: `role="dialog"`, `aria-modal`, close with **Esc**.
- ✅ Toggle buttons use `aria-pressed`; menus use `aria-expanded`.
- ✅ Errors use `role="alert"`; success messages use `role="status"`.
- ✅ Status is shown with text and icons, not only color.
- ✅ The page can be zoomed up to 500% (`maximumScale: 5`).
- ✅ Resume previews on the home page are `inert` pictures, so keyboard users never tab into them.

---

## 13. The home page

The home page is designed like a premium product page: a **dark, glowing hero** that flows into **light, airy sections**, with one more dark "spotlight" panel for Job Match.

### Page order

| # | Section | Background | What it shows |
|---|---|---|---|
| 1 | **Navigation** | Transparent, then a floating dark glass pill after scrolling | Logo, section links, *Open editor* |
| 2 | **Hero** | `slate-950` + indigo / violet / sky aurora + faint 64 px grid | Big headline, start buttons, a real resume tilting in 3D, floating proof chips, role ticker |
| 3 | **Stats strip** | White card that overlaps the hero's bottom edge | 11 templates · 7 steps · 100-point ATS check · 10 sample careers |
| 4 | **Features (bento)** | Light `#F7F8FC` | 7 cards with mini product mockups; one dark card for privacy |
| 5 | **Template gallery** | Light, with soft violet and sky glows | Live preview of all 11 real templates in all 7 colors |
| 6 | **How it works** | White | 4 numbered gradient tiles joined by a thin gradient line |
| 7 | **Our promise** | Light, with a rose → violet → emerald glow | "Typical AI rewrite" vs "AI Resume Studio" side by side |
| 8 | **Job match** | Rounded dark panel with dot pattern | The full job-fit tool with glass cards and a score ring |
| 9 | **FAQ** | Light | Accordion with 7 plain-English answers |
| 10 | **Footer** | `slate-950` | Final call to action and links |

### Home page tokens

| Token | Value | Used for |
|---|---|---|
| Hero headline | 42 px → 74 px, weight 900, letter spacing −0.05em | *"Your experience deserves a better story."* |
| Section headline | 30 → 48 px, weight 900, letter spacing −0.035em | Every section title |
| Eyebrow label | 10 px, bold, UPPERCASE, 0.16em spacing, pill shaped | "TEMPLATE GALLERY", "FAQ" … |
| Glass surface (dark) | `bg-white/[0.05]` + `border-white/10` + `backdrop-blur-xl` | Hero chips, Job Match cards, mobile menu |
| Big radius | 24 px cards · 32–40 px feature panels | Bento cards, template stage, Job Match panel |
| Glow shadow | `0 20px 60px -15px` indigo at 90% | The main white hero button |
| Gradient text | `indigo-600 → violet-600 → sky-600` (light) · `indigo-300 → sky-300` (dark) | Key words in headlines |

### Demo content

The hero and the gallery show a **made-up** person, *Aarav Mehta*, with `example.com` contact details (`src/components/home/landingDemoResume.ts`). No real person's email or phone number appears on the home page.

➡️ Next: **[4. Flowcharts — how everything moves](./04-FLOWCHARTS.md)**

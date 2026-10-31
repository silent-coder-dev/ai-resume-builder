# 3. Design System — Fonts, Colors, Components, and Templates

> **Read time:** about 10 minutes
> **Before this:** [2. Approaches](./02-APPROACHES.md) · **Next:** [4. Flowcharts](./04-FLOWCHARTS.md)

This page lists every visual rule in the app: fonts, colors, spacing, components, motion, layout, and the resume templates. The rules follow **PRD §5** ([PRD](./PRD.md)). Everything lives as **design tokens** in `src/app/globals.css`, so a color or size is changed in one place.

---

## 1. Design principles

The app should feel **minimal, professional, calm, fast, and trustworthy** — like a good work tool, not an advertisement.

| Do | Avoid |
|---|---|
| Plain white surfaces with thin borders | Heavy gradients, glass effects, glowing cards |
| One primary color for main actions | Many bright colors competing |
| Short, clear text | Hype ("Perfect resume guaranteed!") |
| Small, quick motion that explains a change | Motion just for decoration |
| Show the real product (a picture of the editor) | Abstract shapes and stock art |

---

## 2. Fonts

| Use | Font |
|---|---|
| All app text | **Inter** (loaded with `next/font`, variable `--font-inter`) |
| Code-like text (tech stacks) | System mono (`ui-monospace`, Consolas, …) |
| Resume templates | Inter or a serif, depending on the template |

### Type scale

Use these **text tokens** (for example `text-title`). Each includes its line height.

| Token | Size / line height | Weight | Used for |
|---|---|---|---|
| `text-hero` | 48 / 56 px | 700 | Home page headline (36 px on phones) |
| `text-title` | 28 / 36 px | 700 | Page titles |
| `text-heading` | 22 / 30 px | 600 | Section headings |
| `text-card` | 16 / 24 px | 600 | Card titles |
| `text-body` | 14 / 22 px | 400 | Normal text, buttons (600) |
| `text-small` | 13 / 20 px | 400 | Secondary text |
| `text-label` | 12 / 16 px | 500 | Labels and badges |

`cn()` (`src/utils/cn.ts`) knows these tokens, so `cn('text-body', 'text-small')` keeps only the last one.

---

## 3. Colors

### 3.1 Brand

| Token | Hex | Use |
|---|---|---|
| `primary` | `#4F46E5` | Main buttons, links, focus ring, active nav |
| `primary-hover` | `#4338CA` | Hover on primary buttons |
| `primary-light` | `#EEF2FF` | Selected items, soft highlights, icon tiles |

### 3.2 Backgrounds and text

| Token | Hex | Use |
|---|---|---|
| `canvas` | `#F8FAFC` | Page background |
| `surface` | `#FFFFFF` | Cards, panels, dialogs |
| `surface-2` | `#F1F5F9` | Secondary panels, hover, preview background |
| `ink` | `#0F172A` | Main text |
| `ink-2` | `#64748B` | Secondary text |
| `ink-3` | `#94A3B8` | Icons and placeholders only (too light for body text) |
| `line` | `#E2E8F0` | Normal borders |
| `line-strong` | `#CBD5E1` | Hover borders, dashed empty states |

### 3.3 Status

| Token | Hex | Use |
|---|---|---|
| `success` | `#16A34A` | Saved, accepted, strong score |
| `warning` | `#D97706` | Warnings, medium score |
| `error` | `#DC2626` | Errors, critical issues, delete |
| `info` | `#2563EB` | Information messages |

Always pair a status color with **text or an icon**, so the meaning is clear without color.

### 3.4 Resume accent colors (user can choose)

These color the **resume only**, not the app.

| Name | Hex |
|---|---|
| Corporate Blue | `#2563EB` |
| Executive Slate | `#0F172A` |
| Emerald Green | `#059669` |
| Royal Violet | `#7C3AED` |
| Warm Amber | `#D97706` |
| Crimson Red | `#DC2626` |
| Neutral Zinc | `#52525B` |

New resumes start with the brand color `#4F46E5` unless you choose a default in **Settings**.

---

## 4. Spacing, shape, and depth

| Rule | Value |
|---|---|
| Spacing | 4 px system: 4, 8, 12, 16, 24, 32, 48, 64 |
| Inputs and buttons | 8 px radius (`rounded-lg`) |
| Cards | 12 px radius (`rounded-xl`) |
| Dialogs and large panels | 16 px radius (`rounded-2xl`) |
| Depth | Thin borders first. Small shadow only on primary buttons, menus, and dialogs. |
| Page width | Content up to 1152 px (`max-w-6xl`), 16 px side padding on phones, 24 px on larger screens |

---

## 5. Icons

- Only **Lucide** icons (`lucide-react`). Never mix icon libraries.
- Sizes: 16 px in buttons and lists, 20 px in navigation, 24 px in empty states.
- Decorative icons get `aria-hidden="true"`. Icon-only buttons always have an `aria-label`.
- Lucide has no brand logos, so LinkedIn, GitHub, and portfolio links on resumes are shown as clickable words.

---

## 6. Components

All shared components live in `src/components/ui/`.

### Buttons (`Button.tsx`)

| Variant | Look | Use |
|---|---|---|
| `primary` | Indigo, white text | One main action per area |
| `secondary` (default) | White, thin border | Normal actions |
| `ghost` | No background | Toolbars and low-key actions |
| `subtle` | Light indigo | AI actions and soft highlights |
| `danger` | Red | Delete |

Sizes: `sm` (32 px), `md` (40 px), `lg` (48 px), `icon` (40 × 40), `icon-sm` (32 × 32). `ButtonLink` gives a link the same look. Buttons show a spinner and stay disabled while busy.

### Form fields (`Field.tsx`)

- `TextField`, `TextareaField`, `SelectField`, and `Checkbox` always render a real `<label>`.
- Hints and errors sit under the field and are linked with `aria-describedby`.
- Invalid fields get a red border (`aria-invalid`).
- Focus: indigo border plus a soft indigo ring.

### Cards and layout (`Primitives.tsx`)

| Component | Use |
|---|---|
| `Card` | White, 12 px radius, thin border |
| `PageHeader` | Page title, short description, and actions |
| `Badge` | Small colored label (neutral, primary, success, warning, error) |
| `Alert` | A message box: info, success, warning, error |
| `EmptyState` | Dashed box with an icon, a sentence, and an action |
| `Skeleton` | Gray pulsing block while data loads |

### Dialogs (`Dialog.tsx`)

- Built on the native `<dialog>` element: focus stays inside, **Esc** closes, and focus returns to the button that opened it.
- `ConfirmDialog` for anything that cannot be undone: clear title, what will happen, and a red confirm button.
- On phones, dialogs fill nearly the whole width.

### Menus and toasts

- `Menu.tsx`: a small dropdown menu that works with the arrow keys and **Esc**.
- `Toast.tsx`: short messages at the bottom ("Resume duplicated"), announced to screen readers, sometimes with an action ("Open").

---

## 7. Motion

| Motion | Duration |
|---|---|
| Hover and color changes | 150 ms (Tailwind default, set in the tokens) |
| Dialog open (fade + small rise) | 180 ms |
| Sidebar collapse | 200 ms |
| Preview fade on template change | 150 ms |

- Loading uses **skeletons**, not big spinners.
- **Reduced motion** is respected in two ways: the system setting (`prefers-reduced-motion`) and the in-app setting in **Settings → Motion** (adds `html.reduce-motion`). Both turn animations off.

---

## 8. Layout and responsive rules

| Screen | Width | Layout |
|---|---|---|
| Phone | 320–767 px | Top bar with a menu button. Builder shows **Edit** or **Preview**, one at a time. |
| Tablet | 768–1023 px | Collapsible left sidebar. Builder still switches Edit / Preview. |
| Laptop | 1024–1279 px | Sidebar (collapsed to icons in the Builder) + editor + preview side by side. A section picker sits above the editor. |
| Desktop | 1280 px and up | Sidebar + section list + editor + preview. |

**Rules for every page:**

- No sideways scrolling at any width (checked by the phone tests).
- Touch targets at least 32 px, most 40 px.
- The Builder's section list and preview stay in place while the editor scrolls.

---

## 9. The resume page

| Property | Value |
|---|---|
| Page size | A4 portrait — **794 × 1123 px** at 96 DPI (210 × 297 mm) |
| Page margin in print | 0 (each template has its own inner padding, repeated on every page) |
| Section heading | Small, bold, uppercase, accent color, thin accent underline |
| Skills | Small gray pills (skill levels are used by AI only and are not printed) |
| Experience and internships | Role (bold) + dates + company and location + bullet list |
| Projects | Title (bold) + tech stack + description + **Code** and **Live** links |
| Education | Degree (bold) + institution and field + year and score |
| Languages | Name and level |
| Custom sections | Your own title, then items with title, subtitle, date, and description |
| Links | LinkedIn, GitHub, and portfolio as clickable words |
| Empty sections | Not drawn at all |

---

## 10. The 11 templates

Every template uses the same sections and follows the resume's own section order. Only the **header and page frame** change.

| # | Template (ID) | Look | How the accent color is used | Best for |
|---|---|---|---|---|
| 0 | **Blank Canvas** (`blank`) | Very plain, simple underline | Section headings | The simplest layout |
| 1 | **Modern Tech** (`modern`) — *default* | Name in accent color, contact icons, thick rule | Name, header line, headings | Software, IT, startups |
| 2 | **Executive Serif** (`classic`) | Centered uppercase serif name | Header line, headings | Managers, senior roles |
| 3 | **Creative Sidebar** (`sidebar`) | Dark side column with name, contact, and profiles | Headings in the main column | Designers, portfolios |
| 4 | **Compact Grid** (`compact`) | Tight spacing, contact on the right | Name, header line, headings | Fitting a lot onto one page |
| 5 | **Pure Minimal** (`minimal`) | Light name, lots of white space | Headings | A clean, quiet look |
| 6 | **Corporate Banner** (`corporate`) | Full-width colored banner | Banner, headings | Business, consulting, sales |
| 7 | **Career Timeline** (`timeline`) | Accent bar and a thin line down the page | Side bar, headings | A clear career path |
| 8 | **Legal / Academic** (`academic`) | "Curriculum Vitae", centered serif | Headings | Law, research, teaching |
| 9 | **Bold Designer** (`creative`) | Huge uppercase name, thick bottom border | Title, border, headings | Creative and marketing roles |
| 10 | **Clinical Healthcare** (`medical`) | Soft gray header box | Headings | Doctors, nurses, healthcare |

**Shared rules for all templates:**

- Registered once in `templateCatalog.tsx`; the Builder, the template picker, the home page, and PDF export all read from it.
- Placeholder text ("Your Name") appears faded in the preview only and is never printed.
- No watermark or site branding is ever printed on a resume.

---

## 11. Writing style (UI text)

| Rule | Good example | Avoid |
|---|---|---|
| Simple, friendly words | *"Add your work notes first."* | *"rawDetails is required."* |
| Honest about AI | *"Review every change before you accept it."* | *"Perfect resume guaranteed!"* |
| Say what happens next | *"Your original resume was not changed."* | Silent changes |
| Short loading text | *"Reading your PDF…"* | A spinner with no text |
| Give the fix, not just the error | *"Use a PDF smaller than 8 MB."* | *"Invalid input."* |
| Scores are estimates | *"Readiness score (estimate)"* | *"ATS pass guaranteed"* |

---

## 12. Accessibility checklist (WCAG 2.2 AA)

- ✅ Text colors meet contrast rules (`ink-3` is never used for body text).
- ✅ One visible focus ring everywhere (`:focus-visible`, 2 px indigo outline).
- ✅ A **Skip to content** link on every app page.
- ✅ Every field has a label; errors are linked to their field.
- ✅ Icon-only buttons have `aria-label`s.
- ✅ Dialogs trap focus, close with **Esc**, and return focus.
- ✅ Tabs (Edit / Preview) use `role="tab"` and `aria-selected`.
- ✅ Save status and toasts are announced to screen readers.
- ✅ The whole Builder works with the keyboard, including undo (**Ctrl+Z**) and redo.
- ✅ Reduced motion respected (system setting and in-app setting).

---

## 13. Full-screen rooms

The AI Interview and the protected tests are the one place the app leaves its calm white style, on purpose. They should feel like an occasion, with nothing else on screen.

| Screen | Look |
|---|---|
| **Interview room** | Dark (`slate-950`) with the interviewer on a soft blue stage, captions like a video call, and the conversation in a side panel |
| **Interviewer states** | A soft halo shows the state: indigo while speaking, green while listening, amber while thinking. A dot and a text label say the same thing, so color is never the only signal. |
| **Protected test** | A dark top bar with the shield, warnings, and timer. Questions stay on the normal light surface. The timer turns red in the last minute. |
| **Code editor** | The One Dark theme, with the console below it |

Full-screen layers hide the page behind them from keyboards and screen readers (`inert`). All interviewer animation stops under reduced motion.

---

## 14. The home page

The home page follows **PRD §7**: calm, white, and focused on the real product.

### Page order

1. **Header** — logo; links *Features, Templates, How It Works, About*; buttons *Open Resume Studio* and *Create Resume*.
2. **Hero** — headline *"Build a Resume That Gets You Noticed."*, a short subheadline, buttons *Build My Resume* and *Explore Templates*, and a **picture of the real editor** (`EditorPreview.tsx`). Returning visitors also see *Continue editing*.
3. **Features** — six cards: AI Resume Writing, ATS Readiness Analysis, Job Description Matching, GitHub Project Import, Professional Templates, Free PDF Export.
4. **Templates** — live thumbnails of all 11 templates, each with *Use this template*.
5. **How it works** — five short steps.
6. **Privacy** — five plain points about where data lives.
7. **About** and the **footer**.

### Demo content

Home page previews use only the made-up profile in `landingDemoResume.ts` (contacts on `example.com`), never a real person's data, and always the default section order.

➡️ Next: **[4. Flowcharts](./04-FLOWCHARTS.md)**

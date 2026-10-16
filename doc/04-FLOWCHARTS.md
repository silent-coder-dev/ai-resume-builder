# 4. Flowcharts — How Everything Moves

> **Read time:** about 10 minutes
> **Before this:** [3. Design System](./03-DESIGN-SYSTEM.md) · **Next:** [5. Directory Map](./05-DIRECTORY-MAP.md)

Every chart below is written in **Mermaid**. GitHub shows them as diagrams automatically. In VS Code, install a Mermaid preview extension to see them.

**How to read the shapes:**

| Shape | Meaning |
|---|---|
| Rectangle `[ ]` | A step or a screen |
| Diamond `{ }` | A question / decision |
| Rounded `( )` | Start or end |
| Cylinder `[( )]` | Saved data |

---

## Contents

1. [System overview](#1-system-overview)
2. [The full user journey](#2-the-full-user-journey)
3. [Starting a resume](#3-starting-a-resume)
4. [The editing loop](#4-the-editing-loop)
5. [Saving and restoring the draft](#5-saving-and-restoring-the-draft)
6. [Importing a PDF resume](#6-importing-a-pdf-resume)
7. [AI Summary Studio](#7-ai-summary-studio)
8. [AI Enhance for work bullets](#8-ai-enhance-for-work-bullets)
9. [Optimize with AI (review and apply)](#9-optimize-with-ai-review-and-apply)
10. [Job matching and tailoring](#10-job-matching-and-tailoring)
11. [The sync token, step by step](#11-the-sync-token-step-by-step)
12. [Reordering and drawing sections](#12-reordering-and-drawing-sections)
13. [The live preview and page counter](#13-the-live-preview-and-page-counter)
14. [Downloading the PDF](#14-downloading-the-pdf)
15. [Inside the AI route](#15-inside-the-ai-route)
16. [AI model retry and fallback](#16-ai-model-retry-and-fallback)
17. [How the ATS score is calculated](#17-how-the-ats-score-is-calculated)

---

## 1. System overview

```mermaid
flowchart LR
    U(["User"]) --> HOME["Home page /"]
    U --> ED["Editor /builder"]

    subgraph Browser
        HOME
        ED
        STORE["Zustand store"]
        LS[("localStorage<br/>ai-resume-builder-store")]
        PREVIEW["Live A4 preview<br/>11 templates"]
        PDF["Print frame<br/>Save as PDF"]
    end

    subgraph Server
        API["POST /api/ai"]
    end

    subgraph AIProvider["AI provider"]
        GEM["Google Gemini"]
        OR["OpenRouter"]
    end

    HOME <--> STORE
    ED <--> STORE
    STORE <--> LS
    STORE --> PREVIEW
    PREVIEW --> PDF
    HOME -- "import, match, tailor" --> API
    ED -- "summary, bullets, optimize, import" --> API
    API --> GEM
    API --> OR
```

---

## 2. The full user journey

```mermaid
flowchart TD
    A(["Open the website"]) --> B["Home page"]
    B --> C{"What do you want to do?"}

    C -->|Build a resume| D{"Saved draft on this device?"}
    D -->|Yes| E["Continue saved resume"]
    D -->|No or start over| F{"Start how?"}
    F -->|From scratch| G["Blank editor"]
    F -->|Import a PDF| H["AI reads the PDF"]
    H --> I["Editor filled with your details"]
    E --> J["Editor"]
    G --> J
    I --> J

    C -->|Try templates| TG["Template gallery:<br/>pick template + color"]
    TG --> TU["Use this template"]
    TU --> J

    C -->|Check a job| K["Job Match section"]
    K --> L["Get fit analysis"]
    L --> M{"All fit checks pass?"}
    M -->|Yes| N["Sync resume with job"]
    N --> J
    M -->|No| O["See gaps and tips"]
    O --> J

    J --> P["Edit 7 steps with live preview"]
    P --> Q["Use AI helpers<br/>summary, bullets, optimize"]
    Q --> R["Pick template, color, section order"]
    R --> S["Check ATS score and page count"]
    S --> T(["Download PDF"])
```

---

## 3. Starting a resume

```mermaid
flowchart TD
    A(["Click Start a new resume"]) --> B["Two choices open"]
    B --> C{"Choice"}

    C -->|Start from scratch| D{"Saved draft exists?"}
    D -->|Yes| E{"Confirm: replace saved draft?"}
    E -->|Cancel| F(["Stay on home, draft kept"])
    E -->|OK| G["Reset to blank resume"]
    D -->|No| G
    G --> H(["Open editor"])

    C -->|Import a PDF| I{"Saved draft exists?"}
    I -->|Yes| J{"Confirm: replace saved draft?"}
    J -->|Cancel| F
    J -->|OK| K["Choose PDF file"]
    I -->|No| K
    K --> L["Import flow - see chart 6"]
    L --> M{"Success?"}
    M -->|Yes| H
    M -->|No| N(["Show error under the hero buttons"])
```

---

## 4. The editing loop

```mermaid
flowchart TD
    A(["User types in a form field"]) --> B["Named store action<br/>for example updateSkill"]
    B --> C["Store updates resumeData"]
    C --> D[("Saved to localStorage")]
    C --> E["Template re-draws"]
    C --> F["ATS score recalculates"]
    E --> G["Preview page grows or shrinks"]
    G --> H["Page counter and A4 cut lines update"]
    F --> I["Score ring and tips update"]
    H --> J(["User sees the result instantly"])
    I --> J
```

**Wizard steps:**

```mermaid
flowchart LR
    S1["1 Personal<br/>+ links + summary"] --> S2["2 Skills"] --> S3["3 Experience"] --> S4["4 Projects"] --> S5["5 Education"] --> S6["6 Certifications"] --> S7["7 Achievements"]
    S7 --> DONE(["Check preview, then Download PDF"])
```

---

## 5. Saving and restoring the draft

```mermaid
flowchart TD
    A(["Page loads in the browser"]) --> B{"Data under<br/>ai-resume-builder-store?"}
    B -->|Yes| D["Read saved data"]
    B -->|No| C{"Data under old key<br/>ai_resume_studio_store?"}
    C -->|Yes| C2["Move it to the new key<br/>and delete the old key"]
    C2 --> D
    C -->|No| E["Start with a blank resume"]

    D --> F["Repair the data<br/>fill missing lists<br/>fix section order"]
    F --> G["Store is hydrated"]
    E --> G

    G --> H{"Which page?"}
    H -->|Editor| I["Hide the loader and show the editor"]
    H -->|Home| J{"Draft has real content?"}
    J -->|Yes| K["Show Continue saved resume"]
    J -->|No| L["Hide it"]
```

**Why the loader?** The server cannot see localStorage. Waiting for "hydrated" means the first screen always matches, so there is no error and no flash of an empty resume.

---

## 6. Importing a PDF resume

```mermaid
flowchart TD
    A(["User picks a PDF"]) --> B{"Ends in .pdf or PDF type?"}
    B -->|No| X1(["Error: choose a PDF"])
    B -->|Yes| C{"Size between 1 byte and 8 MB?"}
    C -->|No| X2(["Error: too big or empty"])
    C -->|Yes| D{"File starts with %PDF-?"}
    D -->|No| X3(["Error: not a readable PDF"])
    D -->|Yes| E["Convert file to Base64"]
    E --> F["POST /api/ai<br/>action parse-resume-pdf"]
    F --> G["AI reads the real PDF<br/>Gemini inlineData or OpenRouter file parser"]
    G --> H["Strict rules:<br/>copy only what is visible<br/>never guess, leave gaps empty"]
    H --> I["Server cleans the JSON"]
    I --> J["Browser normalizes:<br/>fill fields, drop empty items,<br/>unique IDs, trim text"]
    J --> K["setResumeData"]
    K --> L(["Editor shows the imported resume"])
```

---

## 7. AI Summary Studio

```mermaid
flowchart TD
    A(["Click the summary button"]) --> B{"Target role AND<br/>at least one skill, job,<br/>project, or education?"}
    B -->|No| C["Show what to add,<br/>with buttons to jump to each step"]
    B -->|Yes| D["Ask: fresher or experienced?"]
    D --> E{"Answer"}
    E -->|Fresher| F["Ask: graduated or still studying?"]
    F --> G["Ask: graduation year"]
    G --> H{"Year valid?<br/>graduated: not in the future<br/>studying: this year or later"}
    H -->|No| I["Show a clear hint"]
    H -->|Yes| K
    E -->|Experienced| J["Ask: years of experience"]
    J --> K["POST /api/ai<br/>action generate-summary"]
    K --> L["AI writes 3 sentences, 55-75 words,<br/>only from your details"]
    L --> M(["Summary appears in the box,<br/>fully editable"])
```

---

## 8. AI Enhance for work bullets

```mermaid
flowchart TD
    A(["Write rough notes for a job"]) --> B["Click AI Enhance"]
    B --> C["POST /api/ai<br/>action enhance-experience"]
    C --> D{"Notes present and<br/>under 5,000 characters?"}
    D -->|No| E(["Error shown under the notes"])
    D -->|Yes| F["AI writes 2-3 bullets<br/>X-Y-Z style, no invented numbers"]
    F --> G{"Got at least one bullet?"}
    G -->|No| E
    G -->|Yes| H["Bullets saved to the experience"]
    H --> I["Editable box: one bullet per line"]
    I --> J{"Happy with them?"}
    J -->|Edit| I
    J -->|Use my notes instead| K["Bullets cleared,<br/>resume shows the notes"]
    J -->|Yes| L(["Bullets appear on the resume"])
```

---

## 9. Optimize with AI (review and apply)

```mermaid
flowchart TD
    A(["Click Optimize with AI"]) --> B{"Resume has content?"}
    B -->|No| Z(["Button stays disabled"])
    B -->|Yes| C["Send the resume to the server"]
    C --> D["Server sends ONLY narrative text to the AI:<br/>summary, experience notes and bullets,<br/>project and achievement descriptions"]
    D --> E["AI returns polished wording"]
    E --> F["Server copies back only allowed fields,<br/>matched by ID, same bullet count"]
    F --> G["Review window: Original vs Suggested<br/>for every change"]
    G --> H{"User choice"}
    H -->|Keep original or Esc| I(["Nothing changes"])
    H -->|Apply| J["Merge changes into the CURRENT resume by ID"]
    J --> K(["New rows and recent edits are kept"])
```

---

## 10. Job matching and tailoring

```mermaid
flowchart TD
    A(["Job Match section"]) --> B{"Which resume?"}
    B -->|Upload a PDF| C["Import flow, kept only for this comparison"]
    B -->|Use saved resume| D["Use the editor draft"]
    C --> E["Paste or upload the job description<br/>80 to 30,000 characters"]
    D --> E
    E --> F["POST /api/ai<br/>action match-job"]
    F --> G["AI lists up to 14 requirements<br/>with evidence, gaps, and warnings"]
    G --> H["Server applies the gate"]
    H --> I{"Field aligned?<br/>Key skills shown?<br/>Experience level fits?<br/>No blockers?<br/>3+ requirements checked?"}
    I -->|Any No| J(["Show result + reasons.<br/>Sync button locked"])
    I -->|All Yes| K["Server signs a sync token, valid 15 min"]
    K --> L["Show result. Sync button unlocked"]
    L --> M{"Analysed resume differs<br/>from the saved draft?"}
    M -->|Yes| N{"Confirm replace?"}
    N -->|Cancel| O(["Nothing changes"])
    N -->|OK| P
    M -->|No| P["POST /api/ai<br/>action tailor-resume + token"]
    P --> Q{"Token valid for THIS<br/>resume and THIS job?"}
    Q -->|No| R(["403: run the analysis again"])
    Q -->|Yes| S["AI tailors wording,<br/>keeps every fact, ID, and date"]
    S --> T["Saved to the editor"]
    T --> U(["Synced - Open in editor"])
```

---

## 11. The sync token, step by step

```mermaid
sequenceDiagram
    participant B as Browser
    participant S as Server /api/ai
    participant A as AI model

    B->>S: match-job (resume, job description)
    S->>A: Compare resume vs job
    A-->>S: Requirements, evidence, fit checks
    S->>S: Apply the 3-check gate
    alt Gate passed
        S->>S: token = HMAC-SHA256 of<br/>hash(resume) + hash(job) + expiry 15 min
        S-->>B: Analysis + syncToken
    else Gate failed
        S-->>B: Analysis + reasons (no token)
    end

    B->>S: tailor-resume (same resume, same job, token)
    S->>S: Check signature, hashes, and expiry
    alt Token valid
        S->>A: Tailor wording, keep facts
        A-->>S: Tailored resume JSON
        S-->>B: Tailored resume
    else Token invalid or expired
        S-->>B: 403 - run the analysis again
    end
```

---

## 12. Reordering and drawing sections

```mermaid
flowchart TD
    A(["Click Reorder"]) --> B["Reorder window lists 7 sections"]
    B --> C{"Action"}
    C -->|Up or Down arrow| D["moveSection"]
    C -->|Eye icon| E["toggleSectionVisibility"]
    C -->|Reset to Default| F["resetSectionOrder"]
    D --> G[("sectionOrder saved")]
    E --> G
    F --> G
    G --> H["Template draws the header first,<br/>always at the top"]
    H --> I["For each VISIBLE section, in order"]
    I --> J{"Section has real content?"}
    J -->|No| K["Skip - draw nothing"]
    J -->|Yes| L["Draw heading + items"]
    K --> M(["Clean resume, no empty headings"])
    L --> M
```

---

## 13. The live preview and page counter

```mermaid
flowchart TD
    A(["Resume content or template changes"]) --> B["New page element mounts"]
    B --> C["ResizeObserver starts watching it"]
    C --> D["Read page height in px"]
    D --> E["pages = round up of height / 1123"]
    E --> F{"pages = 1?"}
    F -->|Yes| G["Green label: 1 Page - Optimal for ATS"]
    F -->|No| H["Amber label: Multi-Page"]
    H --> I["Draw a red dashed line<br/>at every 1123 px"]
    D --> J["Scale page to fit the screen width,<br/>plus manual zoom 35-140%"]
```

---

## 14. Downloading the PDF

```mermaid
flowchart TD
    A(["Click Download PDF"]) --> B["Copy the printable-resume-canvas element"]
    B --> C["Remove .no-print parts:<br/>cut lines and placeholders"]
    C --> D["Build a print page:<br/>app styles + fonts + A4 rules"]
    D --> E["Write it into a hidden iframe"]
    E --> F["Wait for stylesheets and fonts<br/>max 2.5 seconds"]
    F --> G["Open the browser print dialog"]
    G --> H["Suggested name: Your_Name_Resume"]
    H --> I(["User picks Save as PDF"])
```

**Print rule:** `@page { size: A4 portrait; margin: 0 }` is placed outside `@media print`, so the browser cannot add its own URL or date to the page.

---

## 15. Inside the AI route

```mermaid
flowchart TD
    A(["POST /api/ai"]) --> B{"Body is valid JSON?"}
    B -->|No| X1(["400: body must be valid JSON"])
    B -->|Yes| C{"action present?"}
    C -->|No| X2(["400: missing action"])
    C -->|Yes| D{"Which action?"}

    D --> P1["parse-resume-pdf"]
    D --> P2["match-job"]
    D --> P3["tailor-resume"]
    D --> P4["optimize-resume"]
    D --> P5["enhance-experience"]
    D --> P6["generate-summary"]
    D --> P7["generate-cover-letter"]
    D -->|Anything else| X3(["400: unknown action"])

    P1 & P2 & P3 & P4 & P5 & P6 & P7 --> V{"Input valid and<br/>within limits?"}
    V -->|No| X4(["400 with a clear message<br/>or 403 for a bad sync token"])
    V -->|Yes| G["generateText<br/>prompt with evidence-only rules"]
    G --> H{"AI_PROVIDER"}
    H -->|gemini| GM["Gemini + JSON mode"]
    H -->|openrouter| ORT["OpenRouter + model fallbacks"]
    GM --> J["Clean and check the reply"]
    ORT --> J
    J --> K(["200 with result"])
    G -.->|error| E{"Busy: 429, 502, 503, 504?"}
    E -->|Yes| X5(["Same status: AI is busy, try again"])
    E -->|No| X6(["500 with the error message"])
```

---

## 16. AI model retry and fallback

```mermaid
flowchart TD
    A(["Call the main model<br/>gemini-3.8-flash"]) --> B{"Result"}
    B -->|Success| OK(["Return the answer"])
    B -->|500 or 503 busy| C{"Retries left? max 2"}
    C -->|Yes| D["Wait 500 ms, then 1 s"] --> A
    C -->|No| F
    B -->|404 or 429: model missing or no quota| F["Switch to the fallback model<br/>gemini-3.1-flash-lite"]
    B -->|Other error| ERR(["Stop and report the error"])
    F --> G{"Result"}
    G -->|Success| OK
    G -->|Busy| H{"Retries left?"}
    H -->|Yes| I["Wait and retry"] --> F
    H -->|No| ERR
    G -->|Other error| ERR
```

---

## 17. How the ATS score is calculated

```mermaid
flowchart TD
    A(["Any change to the resume"]) --> B["Start at 0"]
    B --> C["+5 each: name, email, phone, location"]
    C --> D["+5: summary longer than 30 characters"]
    D --> E{"Filled skills"}
    E -->|5 or more| E1["+20"]
    E -->|1 to 4| E2["+10"]
    E -->|0| E3["+0"]
    E1 & E2 & E3 --> F{"Filled work experience?"}
    F -->|Yes| F1["+15, and +10 more if it has real details"]
    F -->|No| F2["+0"]
    F1 & F2 --> G["+15 if at least one project"]
    G --> H["+10 if at least one education entry"]
    H --> I["+5 if at least one link"]
    I --> J["Score out of 100.<br/>Every missed point becomes a tip"]
    J --> K{"Score"}
    K -->|80 or more| K1["Green - Optimized"]
    K -->|50 to 79| K2["Amber - Needs Polish"]
    K -->|Under 50| K3["Red - Needs Polish"]
    K -->|Exactly 100| K4(["Confetti!"])
```

➡️ Next: **[5. Directory Map — every folder explained](./05-DIRECTORY-MAP.md)**

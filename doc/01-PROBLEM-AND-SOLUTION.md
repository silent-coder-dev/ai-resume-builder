# 1. The Problem, the Website, and Who It Is For

> **Read time:** about 6 minutes
> **Next:** [2. Approaches](./02-APPROACHES.md) · **Full plan:** [PRD](./PRD.md)

---

## In one line

**AI Resume Studio** is a free website that helps people build honest, professional resumes, improve them with AI, check them against real jobs, and prepare for interviews — without signing up.

🌐 Live website: **[ai-resume-builder-silent.vercel.app](https://ai-resume-builder-silent.vercel.app)**

> **Our rule:** AI should improve your story, never invent your achievements.

---

## 1. What is the problem?

### Problem 1 — Resumes are read by software first

Most companies use an **ATS** (Applicant Tracking System) that reads a resume before a person does. Fancy layouts, missing skills, or unclear sections can push a good candidate down the list — and nobody tells them why.

### Problem 2 — Writing about yourself is hard

- Freshers think they have "nothing to write" because they have no job yet.
- Many people write weak lines like *"Responsible for tasks"*.
- Small grammar mistakes make a strong candidate look careless.

### Problem 3 — Many AI tools make things up

Some AI tools "improve" a resume by adding fake numbers, skills, or results. A fake claim can be caught in an interview and cost the candidate the job.

### Problem 4 — People lose their work

Many free builders keep a single draft. One refresh, one wrong click on Back, or one "new resume" button can wipe hours of work.

### Problem 5 — One resume does not fit every job

People need different versions (a Java resume, a Full Stack resume, an internship resume) and a quick way to see how each one fits a specific job.

### Problem 6 — Good tools are paid or ask for an account

Many builders lock the PDF behind a payment, require a login, or store personal data on their servers.

---

## 2. What is the website?

| What you can do | How it helps |
|---|---|
| **Build resumes** section by section | A simple editor with a live A4 preview, undo/redo, and autosave |
| **Keep many resumes** in *My Resumes* | Each one is separate; editing one never changes another |
| **Start your way** | Blank, import an old PDF, start from an example, or copy one of your resumes |
| **Write with AI** | Seven writing actions; you see the original next to the suggestion and decide |
| **Analyze your resume** | A saved resume or an uploaded PDF: an explainable readiness score with clear issues and "Fix" buttons |
| **Match a job** | See evidence and real gaps; create a separate tailored version |
| **Import GitHub projects** | Project entries written only from your real repositories |
| **Practice interviews** | Questions from your resume and the job description's requirements, sample code for coding questions, and feedback |
| **Download a PDF** | 11 templates, 7 colors, clean A4, free, no watermark |

It is **free**, needs **no account**, and works on **phones, tablets, and computers**.

---

## 3. How does it solve each problem?

### ✅ Problem 1 — ATS-friendly by design
- Every template uses real text, clear headings, and A4 sizing.
- The **Resume Analyzer** gives a score out of 100 split into six parts (contact, summary, skills, experience & projects, education, formatting) and explains each missing point.
- The score is called an **estimate** — it never promises ATS results or interviews.

### ✅ Problem 2 — Guided writing with AI help
- Clear sections with short tips and examples.
- **Fresher mode:** students and freshers see Education and Projects first and are never marked down for having no job.
- The **AI writing assistant** offers: Improve Writing, Make Concise, Make Professional, Fix Grammar, Improve Clarity, Rewrite as Achievement, and Add Relevant Keywords.

### ✅ Problem 3 — AI that never invents facts
1. Every AI instruction forbids new skills, numbers, employers, dates, degrees, or results.
2. Every suggestion is shown **next to your original**. You can **accept, edit, or reject** it. Nothing changes until you accept.
3. When a stronger line needs information you did not give (like a result), the AI **asks you** instead of guessing.
4. Imported PDFs keep missing sections empty instead of guessing them.

### ✅ Problem 4 — Your work is protected
- **Autosave** with a visible status (*Saving…*, *All changes saved*, *Offline*, *Save failed*, *Recovering previous changes*).
- **Refresh** reopens the same resume. **Back** never deletes anything.
- If the tab closes in the middle of a save, the change is **recovered** next time.
- **Creating a new resume always asks first:** *Continue existing resume*, *Create new resume*, or *Cancel*.
- **Version history** to restore earlier versions, and **JSON backups** to keep a copy anywhere.

### ✅ Problem 5 — The right resume for each job
- Keep as many resumes as you like.
- The **Job Matcher** shows required vs preferred gaps, keyword gaps, and how each project fits.
- **Create tailored version** makes a *new* resume for that job. Your original stays exactly as it was.

### ✅ Problem 6 — Free and private
- No login, no database, no paywall, no watermark.
- Resumes are stored in your own browser.
- Text is sent to the AI provider **only** when you use an AI feature, and only what that feature needs. The *Privacy & Data* page lists exactly what each feature sends.

---

## 4. Who is the user?

### 👩‍🎓 Persona A — Fresher
Recently graduated, no job history, has college and personal projects. Wants internships and entry-level jobs.
**Most useful:** Fresher mode, GitHub Projects, AI help for project descriptions, interview practice.

### 📚 Persona B — Student
Still studying, has marks, certifications, and achievements. Wants an internship-ready resume.
**Most useful:** Education first, Class 10/12 quick-add, Certifications and Achievements sections, the analyzer.

### 👨‍💼 Persona C — Experienced Professional
Has work history and wants a stronger resume, plus versions for different roles.
**Most useful:** AI bullet writing, the Job Matcher with tailored copies, My Resumes.

### 💻 Persona D — Developer
Has GitHub repositories and wants to show real technical work.
**Most useful:** GitHub Projects import, project links on the resume, technical interview questions.

---

## 5. What this website is NOT

- ❌ It does **not** promise a job or an interview.
- ❌ It does **not** write fake experience to "beat" the ATS.
- ❌ It does **not** need an account or store resumes on a server.
- ❌ Scores and match percentages are **estimates**, not hiring predictions.

---

## Summary

| Problem | Our answer |
|---|---|
| ATS software filters resumes | ATS-friendly templates + explainable analyzer |
| Writing is hard | Guided sections, fresher mode, AI writing assistant |
| AI tools invent things | Evidence-only AI + approve every suggestion |
| People lose their work | Autosave, recovery, version history, backups, "ask before new resume" |
| One resume for every job | Many resumes + Job Matcher + separate tailored copies |
| Paid or not private | Free, no sign-up, stored in your browser |

➡️ Next: **[2. Approaches — how it is built and why](./02-APPROACHES.md)**

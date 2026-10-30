// Explainable resume readiness check (PRD §16). Runs instantly in the browser.
// The score is an estimate of completeness and clarity — it never claims to
// predict ATS results or interview selection.

import type { CareerStage, ResumeData, SectionKey } from '@/types/resume';
import { isValidEmail, isValidPhone, isValidUrl, wordCount } from '@/lib/resume/validation';
import {
  experienceBullets,
  hasText,
  isFilledAchievement,
  isFilledCertification,
  isFilledEducation,
  isFilledExperience,
  isFilledLink,
  isFilledProject,
  isFilledSkill,
} from '@/utils/resumeContent';

export type IssueSeverity = 'critical' | 'warning' | 'suggestion';

export type IssueCategory =
  | 'Contact details'
  | 'Summary'
  | 'Skills'
  | 'Experience & projects'
  | 'Education'
  | 'Formatting';

// Where the "Fix" button sends the user in the editor.
export type FixTarget = SectionKey | 'personal';

export interface ResumeIssue {
  id: string;
  severity: IssueSeverity;
  category: IssueCategory;
  title: string;
  explanation: string;
  suggestion: string;
  target: FixTarget;
}

export interface CategoryScore {
  category: IssueCategory;
  score: number;
  max: number;
}

export interface ResumeAnalysis {
  score: number;
  label: 'Needs work' | 'Getting there' | 'Strong' | 'Ready to send';
  categories: CategoryScore[];
  issues: ResumeIssue[];
}

const SEVERITY_ORDER: Record<IssueSeverity, number> = { critical: 0, warning: 1, suggestion: 2 };

function labelFor(score: number): ResumeAnalysis['label'] {
  if (score >= 85) return 'Ready to send';
  if (score >= 70) return 'Strong';
  if (score >= 50) return 'Getting there';
  return 'Needs work';
}

export function analyzeResume(input: { data: ResumeData; careerStage: CareerStage | null }): ResumeAnalysis {
  const { data } = input;
  const issues: ResumeIssue[] = [];
  const add = (issue: ResumeIssue) => issues.push(issue);
  const info = data.personalInfo;

  const experiences = data.experiences.filter(isFilledExperience);
  const internships = (data.internships ?? []).filter(isFilledExperience);
  const projects = data.projects.filter(isFilledProject);
  const education = data.education.filter(isFilledEducation);
  const skills = data.skills.filter(isFilledSkill);
  const extraLinks = (data.links ?? []).filter(isFilledLink);
  // Freshers and students are judged on education and projects, not job history.
  const stage: CareerStage = input.careerStage ?? (experiences.length > 0 ? 'experienced' : 'fresher');
  const earlyCareer = stage !== 'experienced';

  // ---------- Contact details (15) ----------
  let contact = 0;
  if (hasText(info.fullName)) contact += 4;
  else add({ id: 'name', severity: 'critical', category: 'Contact details', title: 'Add your full name', explanation: 'Recruiters and applicant tracking systems file your resume under your name.', suggestion: 'Enter your name exactly as you use it professionally.', target: 'personal' });

  if (isValidEmail(info.email)) contact += 4;
  else
    add({
      id: 'email',
      severity: 'critical',
      category: 'Contact details',
      title: hasText(info.email) ? 'Check your email address' : 'Add an email address',
      explanation: hasText(info.email) ? `“${info.email}” does not look like a valid email address.` : 'Email is the main way employers contact you.',
      suggestion: 'Use a professional address, for example firstname.lastname@example.com.',
      target: 'personal',
    });

  if (isValidPhone(info.phone)) contact += 3;
  else
    add({
      id: 'phone',
      severity: 'warning',
      category: 'Contact details',
      title: hasText(info.phone) ? 'Check your phone number' : 'Add a phone number',
      explanation: hasText(info.phone) ? 'The phone number has too few digits or unusual characters.' : 'Many recruiters call shortlisted candidates.',
      suggestion: 'Include the country code, for example +91 98765 43210.',
      target: 'personal',
    });

  if (hasText(info.location)) contact += 2;
  else add({ id: 'location', severity: 'suggestion', category: 'Contact details', title: 'Add your city and country', explanation: 'Employers often filter by location or check if relocation is needed.', suggestion: 'A city and country is enough, for example “Pune, India”.', target: 'personal' });

  const profileLinks = [info.linkedinUrl, info.githubUrl, info.portfolioUrl, ...extraLinks.map((link) => link.url)].filter(hasText);
  const brokenLinks = profileLinks.filter((url) => !isValidUrl(url));
  if (profileLinks.length > 0 && brokenLinks.length === 0) contact += 2;
  if (profileLinks.length === 0) {
    add({ id: 'links', severity: 'suggestion', category: 'Contact details', title: 'Add a LinkedIn, GitHub, or portfolio link', explanation: 'A profile link lets a reviewer see more of your work.', suggestion: 'Add the links you keep up to date.', target: 'personal' });
  } else if (brokenLinks.length > 0) {
    add({ id: 'broken-links', severity: 'warning', category: 'Contact details', title: 'Fix a profile link', explanation: `${brokenLinks.length === 1 ? 'One link does' : `${brokenLinks.length} links do`} not look like a web address.`, suggestion: 'Use a full address such as linkedin.com/in/your-name.', target: 'personal' });
  }

  // ---------- Summary (10) ----------
  let summary = 0;
  const summaryWords = wordCount(info.summary ?? '');
  if (summaryWords > 0) {
    summary += 6;
    if (summaryWords >= 25 && summaryWords <= 90) summary += 4;
    else if (summaryWords < 25)
      add({ id: 'summary-short', severity: 'warning', category: 'Summary', title: 'Expand your summary a little', explanation: `Your summary has ${summaryWords} words. Two or three sentences (about 40–70 words) give enough context.`, suggestion: 'Say who you are, your strongest relevant skills, and what you want to do next.', target: 'summary' });
    else
      add({ id: 'summary-long', severity: 'suggestion', category: 'Summary', title: 'Shorten your summary', explanation: `Your summary has ${summaryWords} words. Reviewers skim; long summaries get skipped.`, suggestion: 'Keep it to about 40–70 words. Move details into experience or projects.', target: 'summary' });
  } else {
    add({ id: 'summary', severity: 'warning', category: 'Summary', title: 'Add a professional summary', explanation: 'A short summary tells the reader who you are in a few seconds.', suggestion: 'Write 2–3 sentences, or use “Write with AI” — it only uses details you entered.', target: 'summary' });
  }

  // ---------- Skills (15) ----------
  let skillsScore = 0;
  if (skills.length >= 5) skillsScore = 15;
  else if (skills.length > 0) {
    skillsScore = 8;
    add({ id: 'skills-few', severity: 'warning', category: 'Skills', title: 'List a few more skills', explanation: `You have ${skills.length} skill${skills.length === 1 ? '' : 's'}. Five or more helps keyword matching.`, suggestion: 'Add tools, languages, and methods you have actually used.', target: 'skills' });
  } else {
    add({ id: 'skills', severity: 'critical', category: 'Skills', title: 'Add your skills', explanation: 'Applicant tracking systems match skills against the job description.', suggestion: 'List each skill on its own, for example “SQL”, “React”, “Excel”.', target: 'skills' });
  }

  // ---------- Experience & projects (35) ----------
  let work = 0;
  const describedProjects = projects.filter((project) => wordCount(project.description) >= 8);
  if (earlyCareer) {
    if (projects.length > 0) work += 15;
    else add({ id: 'projects', severity: 'critical', category: 'Experience & projects', title: 'Add at least one project', explanation: 'For freshers and students, projects are the strongest proof of skills.', suggestion: 'Add college, personal, or open-source projects. You can import them from GitHub.', target: 'projects' });
    if (projects.length > 0) {
      work += Math.round(10 * (describedProjects.length / projects.length));
      if (describedProjects.length < projects.length)
        add({ id: 'project-detail', severity: 'warning', category: 'Experience & projects', title: 'Describe each project', explanation: `${projects.length - describedProjects.length} project${projects.length - describedProjects.length === 1 ? ' has' : 's have'} little or no description.`, suggestion: 'Say what you built, the tools you used, and what it does.', target: 'projects' });
    }
    // Internships or work are a bonus here, never a penalty.
    work += experiences.length + internships.length > 0 ? 10 : education.length > 0 ? 10 : 0;
  } else {
    if (experiences.length > 0) work += 15;
    else add({ id: 'experience', severity: 'critical', category: 'Experience & projects', title: 'Add your work experience', explanation: 'Experienced candidates are judged mainly on their work history.', suggestion: 'Add each role with company, title, and dates.', target: 'experience' });
    if (experiences.length > 0) {
      const detailed = experiences.filter((item) => experienceBullets(item).length > 0 || wordCount(item.rawDetails) >= 10);
      work += Math.round(10 * (detailed.length / experiences.length));
      if (detailed.length < experiences.length)
        add({ id: 'experience-detail', severity: 'warning', category: 'Experience & projects', title: 'Describe what you did in each role', explanation: `${experiences.length - detailed.length} role${experiences.length - detailed.length === 1 ? ' has' : 's have'} no bullet points.`, suggestion: 'Add 2–5 bullets per role: what you did and the result.', target: 'experience' });
    }
    const supporting =
      projects.length + (data.achievements ?? []).filter(isFilledAchievement).length + (data.certifications ?? []).filter(isFilledCertification).length;
    if (supporting > 0) work += 10;
    else add({ id: 'supporting', severity: 'suggestion', category: 'Experience & projects', title: 'Add a project, achievement, or certification', explanation: 'Extra evidence helps you stand out from candidates with similar roles.', suggestion: 'Add something you are proud of that is relevant to your target role.', target: 'projects' });
  }

  // ---------- Education (15) ----------
  let educationScore = 0;
  if (education.length > 0) {
    educationScore += 10;
    const dated = education.filter((item) => hasText(item.graduationYear));
    educationScore += Math.round(5 * (dated.length / education.length));
    if (dated.length < education.length)
      add({ id: 'education-year', severity: 'suggestion', category: 'Education', title: 'Add graduation years', explanation: 'Years help reviewers understand your timeline.', suggestion: 'Add the passing or expected graduation year for each entry.', target: 'education' });
  } else {
    add({ id: 'education', severity: earlyCareer ? 'critical' : 'warning', category: 'Education', title: 'Add your education', explanation: earlyCareer ? 'Education is one of the first things reviewers check for early-career candidates.' : 'Most employers expect at least your highest qualification.', suggestion: 'Add your degree, institution, and year.', target: 'education' });
  }

  // ---------- Formatting (10) ----------
  let formatting = 10;
  const allRoles = [...experiences, ...internships];
  const longBullets = allRoles.flatMap(experienceBullets).filter((bullet) => wordCount(bullet) > 40);
  if (longBullets.length > 0) {
    formatting -= 3;
    add({ id: 'long-bullets', severity: 'suggestion', category: 'Formatting', title: 'Shorten long bullet points', explanation: `${longBullets.length} bullet${longBullets.length === 1 ? ' is' : 's are'} longer than 40 words.`, suggestion: 'Keep each bullet to one or two lines. Split long ones.', target: experiences.length > 0 ? 'experience' : 'internships' });
  }
  const undated = allRoles.filter((item) => !hasText(item.startDate));
  if (undated.length > 0) {
    formatting -= 3;
    add({ id: 'dates', severity: 'warning', category: 'Formatting', title: 'Add start dates', explanation: `${undated.length} role${undated.length === 1 ? ' is' : 's are'} missing a start date.`, suggestion: 'Use one style everywhere, for example “Jan 2023 – Present”.', target: experiences.some((item) => !hasText(item.startDate)) ? 'experience' : 'internships' });
  }
  const paragraphRoles = allRoles.filter((item) => experienceBullets(item).length === 0 && wordCount(item.rawDetails) > 60);
  if (paragraphRoles.length > 0) {
    formatting -= 2;
    add({ id: 'paragraphs', severity: 'suggestion', category: 'Formatting', title: 'Use bullet points instead of paragraphs', explanation: 'Bullets are faster to scan than long paragraphs.', suggestion: 'Turn your notes into bullets, one achievement per line.', target: experiences.length > 0 ? 'experience' : 'internships' });
  }
  if (summaryWords > 120) formatting -= 2;
  formatting = Math.max(0, formatting);

  const categories: CategoryScore[] = [
    { category: 'Contact details', score: contact, max: 15 },
    { category: 'Summary', score: summary, max: 10 },
    { category: 'Skills', score: skillsScore, max: 15 },
    { category: 'Experience & projects', score: work, max: 35 },
    { category: 'Education', score: educationScore, max: 15 },
    { category: 'Formatting', score: formatting, max: 10 },
  ];
  const score = Math.min(100, categories.reduce((total, item) => total + item.score, 0));

  return {
    score,
    label: labelFor(score),
    categories,
    issues: issues.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]),
  };
}

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });
const DEFAULT_MODEL = 'gemini-3.8-flash';

// Safely extracts valid JSON structures from raw model outputs
function extractCleanJson<T>(rawText: string): T {
  try {
    let clean = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const firstBrace = clean.indexOf('{');
    const firstBracket = clean.indexOf('[');
    const lastBrace = clean.lastIndexOf('}');
    const lastBracket = clean.lastIndexOf(']');

    let start = 0;
    let end = clean.length;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      start = firstBrace;
      end = lastBrace + 1;
    } else if (firstBracket !== -1) {
      start = firstBracket;
      end = lastBracket + 1;
    }

    clean = clean.substring(start, end);
    return JSON.parse(clean) as T;
  } catch (err) {
    console.error('JSON extraction failed on raw text:', rawText);
    throw new Error('AI output formatting error. Please try again.');
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured in environment variables.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { action, payload } = body;

    if (!action) {
      return NextResponse.json({ error: 'Missing action in request body.' }, { status: 400 });
    }

    // 1. NATIVE PDF RESUME PARSER & SCHEMA EXTRACTION
    if (action === 'parse-resume-pdf') {
      const { base64Pdf } = payload || {};
      if (!base64Pdf) {
        return NextResponse.json({ error: 'Base64 PDF data is required.' }, { status: 400 });
      }

      const prompt = `
You are an ATS document parser and data extraction engine.
Analyze the attached PDF resume and transform all extracted content into a strictly valid JSON object matching the schema below.

PARSING CONSTRAINTS:
1. Return ONLY the raw JSON object. Do NOT wrap output in markdown code fences. Do NOT add conversational notes.
2. If any piece of information is missing, set its value to "" (empty string) or [] (empty array). Do NOT emit null, undefined, or placeholder values like "N/A".
3. Sanitize all unformatted text: resolve line wraps, strip orphan bullet symbols, and fix ligature corruptions.
4. Split composite skill lists into distinct atomic string names.

OUTPUT JSON SCHEMA:
{
  "personalInfo": {
    "fullName": "Extracted candidate full name",
    "targetRole": "Current title or target specialization",
    "email": "Clean email address",
    "phone": "Formatted phone number",
    "location": "City, Country",
    "summary": "Extracted professional summary",
    "yearsOfExperience": 0,
    "experienceField": "Primary technical or business domain"
  },
  "skills": [
    { "id": "1", "name": "Atomic Skill Name", "level": "Professional" }
  ],
  "experiences": [
    {
      "id": "1",
      "company": "Company Name",
      "role": "Job Title",
      "startDate": "Month Year or Year",
      "endDate": "Month Year, Year, or Present",
      "isCurrent": false,
      "rawDetails": "Original summary of responsibilities",
      "enhancedBullets": [
        "Extracted bullet 1",
        "Extracted bullet 2"
      ]
    }
  ],
  "projects": [
    {
      "id": "1",
      "title": "Project Title",
      "techStack": ["Tech 1", "Tech 2"],
      "description": "Project implementation and metrics"
    }
  ],
  "education": [
    {
      "id": "1",
      "institution": "University / College",
      "degree": "Degree Title",
      "fieldOfStudy": "Major / Branch",
      "graduationYear": "Year",
      "scoreOrGpa": ""
    }
  ],
  "certifications": [
    { "id": "1", "name": "Certification Name", "issuer": "Issuing Authority" }
  ],
  "achievements": [
    { "id": "1", "title": "Honor or Milestone Title", "description": "Outcome" }
  ],
  "links": [
    { "id": "1", "platform": "LinkedIn", "url": "Profile URL" }
  ]
}
`;

      const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: base64Pdf,
                },
              },
              { text: prompt },
            ],
          },
        ],
      });

      const parsedData = extractCleanJson(response.text || '{}');
      return NextResponse.json({ result: parsedData });
    }

    // 2. ATS JOB MATCHING, GAP ANALYSIS & SENIORITY GATE
    if (action === 'match-job') {
      const { resumeData, jobDescriptionText } = payload || {};
      if (!resumeData || !jobDescriptionText) {
        return NextResponse.json(
          { error: 'Both resumeData and jobDescriptionText are required.' },
          { status: 400 }
        );
      }

      const prompt = `
You are an enterprise-grade Applicant Tracking System (ATS) semantic analysis and screening engine.
Analyze the provided candidate resume against the target job description. Evaluate semantic fit, hard keyword density, seniority requirements, and core domain alignment.

CANDIDATE RESUME:
${JSON.stringify(resumeData)}

TARGET JOB DESCRIPTION:
${jobDescriptionText}

EVALUATION RULES:
1. SENIORITY GATE: Calculate candidate's verifiable years of experience against the job description minimum. Flag gaps of 3 or more years.
2. DOMAIN MISMATCH CHECK: Verify domain compatibility (e.g., non-transferable functional or industry gaps).
3. SCORING METHODOLOGY (0 - 100):
   - 40% Core Technical Skills & Tooling Match
   - 30% Verifiable Project / Work Experience Relevance
   - 20% Seniority, Leadership & Scope Alignment
   - 10% Educational & Certification Credentials
4. Return ONLY valid JSON matching this schema:

{
  "atsScore": 75,
  "matchLevel": "Strong Match",
  "seniorityAssessment": {
    "isSeniorityAligned": true,
    "candidateYoE": 3,
    "requiredYoE": 4,
    "disclaimer": "Detailed seniority gap analysis"
  },
  "domainAlignment": {
    "isDomainMatch": true,
    "candidatePrimaryDomain": "Domain Name",
    "targetRoleDomain": "Target Domain",
    "notes": "Domain compatibility assessment"
  },
  "keywordAnalysis": {
    "matchedKeywords": ["Key1", "Key2"],
    "missingCriticalKeywords": ["Key3", "Key4"],
    "bonusKeywords": ["Key5"]
  },
  "criticalGaps": [
    "Specific missing experience item 1",
    "Specific missing item 2"
  ],
  "actionableResumeFixes": [
    "Actionable bullet improvement 1",
    "Actionable bullet improvement 2"
  ]
}
`;

      const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: prompt,
      });

      const evaluation = extractCleanJson(response.text || '{}');
      return NextResponse.json({ result: evaluation });
    }

    // 3. GOOGLE X-Y-Z FORMULA EXPERIENCE BULLET ENHANCER
    if (action === 'enhance-experience') {
      const { company, role, rawDetails, targetRole } = payload || {};
      if (!rawDetails) {
        return NextResponse.json({ error: 'rawDetails is required.' }, { status: 400 });
      }

      const prompt = `
You are an executive resume strategist and technical writer.
Transform the following rough work experience notes into 2 to 3 high-impact, ATS-optimized bullet points following the Google X-Y-Z formula:
"Accomplished [X], as measured by [Y], by doing [Z]"

ROLE TITLE: ${role || targetRole || 'Software Engineer'}
COMPANY: ${company || 'Organization'}
CANDIDATE NOTES:
${rawDetails}

CONSTRAINTS:
1. Every bullet MUST start with a strong, past-tense technical action verb (e.g., "Architected", "Engineered", "Spearheaded", "Optimized", "Refactored").
2. Include realistic, domain-appropriate engineering metrics if not already specified.
3. Return ONLY a valid JSON array of strings without markdown fences.

Example output:
["Architected microservices with Spring Boot and Java 21, reducing latency by 35% through connection pooling.", "Automated CI/CD deployment pipelines using Docker, saving 8 developer hours weekly."]
`;

      const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: prompt,
      });

      const bullets = extractCleanJson<string[]>(response.text || '[]');
      return NextResponse.json({ result: bullets });
    }

    // 4. EXECUTIVE PROFESSIONAL SUMMARY GENERATOR
    if (action === 'generate-summary') {
      const { targetRole, yearsOfExperience, experienceField, skills, education } = payload || {};

      const prompt = `
You are an executive resume strategist writing an ATS-optimized professional summary.

TARGET SPECIALIZATION: ${targetRole || 'Professional'}
YEARS OF EXPERIENCE: ${yearsOfExperience || 'Proven background'}
PRIMARY FIELD: ${experienceField || 'Software Engineering'}
CORE SKILLS: ${skills?.map((s: any) => s.name).join(', ') || 'Relevant domain skills'}
EDUCATION: ${education?.map((e: any) => e.degree + ' from ' + e.institution).join(', ') || ''}

CONSTRAINTS:
1. Exactly 2 to 3 concise sentences (45-65 words total).
2. NO first-person pronouns (never use "I", "me", "my", "we"). Write in third-person resume style.
3. Structure:
   - Sentence 1: Professional title, total tenure, and primary domain focus.
   - Sentence 2: Key technical competencies, frameworks, and architecture highlights.
   - Sentence 3: Measurable business impact, scale, or resolved problem.
4. Avoid generic filler words (e.g., "hard-working", "passionate", "team player").
5. Return ONLY the plain text summary without quotes or markdown headers.
`;

      const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: prompt,
      });

      return NextResponse.json({ result: response.text?.trim() });
    }

    // 5. TAILORED ATS COVER LETTER GENERATOR
    if (action === 'generate-cover-letter') {
      const { personalInfo, skills, experiences, jobDescriptionText } = payload || {};

      const prompt = `
You are an executive recruiter writing a targeted, ATS-friendly cover letter.

CANDIDATE PROFILE:
- Name: ${personalInfo?.fullName || 'Candidate'}
- Target Role: ${personalInfo?.targetRole || 'Role'}
- Skills: ${skills?.map((s: any) => s.name).join(', ') || ''}
- Key Highlights: ${experiences?.map((e: any) => e.role + ' at ' + e.company).join('; ') || ''}

TARGET JOB / COMPANY DETAILS:
${jobDescriptionText || ''}

RULES:
1. Structure: Professional Salutation -> Direct Value Proposition -> 2 Measurable Technical Wins -> Strategic Alignment -> Professional Call to Action.
2. Tone: Professional, confident, and direct.
3. Length: 250 - 300 words across 3 to 4 concise paragraphs.
4. Return ONLY the raw formatted cover letter text without JSON or markdown formatting.
`;

      const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: prompt,
      });

      return NextResponse.json({ result: response.text?.trim() });
    }

    return NextResponse.json({ error: `Unknown action: "${action}"` }, { status: 400 });
  } catch (err: any) {
    console.error('AI Route Fatal Error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal AI Server Error' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

async function generateJsonWithFallback(prompt: string, inlineData?: { mimeType: string; data: string }) {
  const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: 'application/json' },
      });

      const contents = inlineData
        ? [{ role: 'user', parts: [{ text: prompt }, { inlineData }] }]
        : [{ role: 'user', parts: [{ text: prompt }] }];

      const response = await model.generateContent({ contents } as any);
      const text = response.response.text();
      return JSON.parse(text);
    } catch (err) {
      lastError = err;
      console.warn(`Model ${modelName} failed or unavailable, attempting next fallback...`, err);
    }
  }

  throw lastError || new Error('All Gemini model fallbacks failed.');
}

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing GEMINI_API_KEY in environment variables.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { action, payload } = body;

    // 1. GENERATE PROFESSIONAL SUMMARY
    if (action === 'generate-summary') {
      const { targetRole, yearsOfExperience, experienceField, skills, education } = payload;
      const prompt = `
You are an expert career consultant and ATS optimization specialist.
Write a punchy, ATS-friendly professional summary (3-4 sentences max) for a candidate with the following profile:
- Target Job Title: ${targetRole || 'Professional'}
- Years of Experience: ${yearsOfExperience || 'Entry Level'}
- Specialized Field: ${experienceField || 'General'}
- Top Skills: ${(skills || []).map((s: any) => s.name).join(', ')}
- Education: ${(education || []).map((e: any) => `${e.degree} from${e.institution}`).join(', ')}

Return a strict JSON object:
{
  "summary": "Your generated professional summary statement here."
}
`;
      const result = await generateJsonWithFallback(prompt);
      return NextResponse.json({ result: result.summary });
    }

    // 2. ENHANCE WORK EXPERIENCE BULLETS
    if (action === 'enhance-experience') {
      const { company, role, rawDetails, targetRole } = payload;
      const prompt = `
You are an elite tech recruiter and resume writer.
Transform these informal job notes into 2 to 4 high-impact, ATS-optimized resume bullet points using the Google X-Y-Z formula ("Accomplished [X] as measured by [Y], by doing [Z]").
- Job Title: ${role || 'Specialist'}
- Company: ${company || 'Company'}
- Target Role: ${targetRole || 'Professional'}
- Raw Notes: "${rawDetails}"

Return a strict JSON object:
{
  "bullets": [
    "Action-driven bullet point 1 with metrics/technologies",
    "Action-driven bullet point 2 with metrics/technologies"
  ]
}
`;
      const result = await generateJsonWithFallback(prompt);
      return NextResponse.json({ result: result.bullets || [] });
    }

    // 3. PARSE RESUME FILE UPLOAD
    if (action === 'parse-resume-file') {
      const { base64Data, mimeType, fileName } = payload;
      const prompt = `
Extract and organize all resume data from this uploaded document (${fileName}) into a structured JSON matching this schema:
{
  "personalInfo": {
    "fullName": string,
    "email": string,
    "phone": string,
    "location": string,
    "targetRole": string,
    "yearsOfExperience": string,
    "experienceField": string,
    "summary": string
  },
  "skills": [{ "name": string, "level": "Beginner" | "Intermediate" | "Professional" }],
  "links": [{ "platform": string, "url": string }],
  "experiences": [{
    "company": string,
    "role": string,
    "startDate": string,
    "endDate": string,
    "isCurrent": boolean,
    "rawDetails": string,
    "enhancedBullets": string[]
  }],
  "education": [{
    "institution": string,
    "degree": string,
    "fieldOfStudy": string,
    "graduationYear": string,
    "scoreOrGpa": string
  }],
  "projects": [{
    "title": string,
    "techStack": string[],
    "description": string
  }],
  "certifications": [{ "name": string, "issuer": string }],
  "achievements": [{ "title": string, "description": string }]
}
`;
      const result = await generateJsonWithFallback(prompt, {
        mimeType: mimeType || 'application/pdf',
        data: base64Data,
      });
      return NextResponse.json({ result });
    }

    // 4. ROBUST ATS JOB MATCHER WITH DEEP EDGE-CASE AUDITING
    if (action === 'match-jd') {
      const { resumeData, jobDescription, forceAnyway } = payload;

      // Edge case: Short / Garbage JD validation
      if (!jobDescription || jobDescription.trim().length < 40) {
        return NextResponse.json(
          { error: 'The provided job description is too brief. Please paste the full job posting.' },
          { status: 400 }
        );
      }

      const prompt = `
You are an expert ATS auditor, senior recruiter, and talent compliance analyst.
Analyze the candidate's resume against the target Job Description and audit for critical career edge cases.

Target Job Description:
"""
${jobDescription}
"""

Candidate Profile:
- Target Role: "${resumeData?.personalInfo?.targetRole || ''}"
- Stated Domain/Field: "${resumeData?.personalInfo?.experienceField || ''}"
- Years of Experience: "${resumeData?.personalInfo?.yearsOfExperience || '0'}"
- Candidate Summary: "${resumeData?.personalInfo?.summary || ''}"
- Candidate Skills: ${(resumeData?.skills || []).map((s: any) => s.name).join(', ')}
- Candidate Education: ${(resumeData?.education || []).map((e: any) => `${e.degree} in ${e.fieldOfStudy} from${e.institution}`).join(', ')}
- Candidate Projects: ${(resumeData?.projects || []).map((p: any) => `${p.title}:${p.description}`).join(' | ')}
- Work History: ${(resumeData?.experiences || []).map((e: any) => `${e.role} at ${e.company}:${e.rawDetails}`).join('\n')}

Force Mode Flag: ${forceAnyway ? 'TRUE (User consented to proceed despite warnings)' : 'FALSE'}

EVALUATION RULES & EDGE CASES:
1. DOMAIN MISMATCH (e.g. Commerce/B.Com applying for Machine Learning Scientist or Clinical Medicine, or Arts student applying for Embedded Systems):
   - Set "domainMismatch": true if candidate's background has zero foundational connection to the JD domain.
   - In "domainMismatchDetails", clearly explain the discrepancy (e.g., "This role is in Advanced Distributed Systems, whereas your background is focused on Financial Accounting & Auditing.").
2. LICENSE / STATUTORY RESTRICTION (e.g., Medicine, Legal Bar, Civil Engineering PE, CFA):
   - Set "licenseRequired": true if this job mandates government or board certification that cannot be acquired without statutory degrees.
3. SENIORITY INVERSION (e.g. Fresher applying to Senior Director/Architect OR Senior applying to unpaid intern):
   - Set "seniorityMismatch": true and explain in "seniorityWarning".
4. TAILORED SUMMARY:
   - If domainMismatch is true AND Force Mode is FALSE: Provide a conservative summary indicating transferrable traits without claiming non-existent expertise.
   - If Force Mode is TRUE: Construct an honest career-pivot summary emphasizing bridgeable soft skills, analytical curiosity, and rapid self-directed retraining without falsifying qualifications.
5. DISCLAIMER BULLETS:
   - Provide "disclaimerPoints": an array of 3 to 4 firm cautionary points (e.g., "ATS systems will rank this profile low due to missing degree prerequisites", "You risk immediate screening disqualification", "Misrepresenting credentials can lead to blacklisting").

Return a strict JSON object with this exact schema:
{
  "matchScore": number (0-100),
  "domainMismatch": boolean,
  "domainMismatchDetails": string | null,
  "licenseRequired": boolean,
  "licenseWarning": string | null,
  "seniorityMismatch": boolean,
  "seniorityWarning": string | null,
  "disclaimerPoints": string[],
  "matchingSkills": string[],
  "missingSkills": string[],
  "tailoredSummary": string,
  "fresherBridgeStrategy": string[],
  "actionableTips": string[]
}
`;
      const result = await generateJsonWithFallback(prompt);
      return NextResponse.json({ result });
    }

    return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('AI API Route Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error processing AI request.' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';

// Target the official active generation models
const MODELS = [
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is missing in .env.local' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { action, payload } = body;

    let parts: any[] = [];

    if (action === 'generate-summary') {
      const { targetRole, yearsOfExperience, experienceField, skills, education } = payload;
      const skillsStr = skills?.map((s: { name: string }) => s.name).join(', ') || 'Software Development';
      const eduStr = education?.[0]?.degree
        ? `${education[0].degree} in ${education[0].fieldOfStudy}`
        : 'Relevant Degree';

      parts = [{
        text: `Write an ATS-friendly, impactful 2-3 sentence resume professional summary.
Target Role: ${targetRole || 'Software Professional'}
Years of Experience: ${yearsOfExperience || '0'}
Domain: ${experienceField || 'Technology'}
Skills: ${skillsStr}
Education: ${eduStr}

Rules:
- Do NOT use pronouns like "I", "me", "my".
- Focus on skills, technical delivery, and measurable value.
- Return ONLY the final text without quotes, headers, or conversational introductions.`
      }];
    } else if (action === 'enhance-experience') {
      const { company, role, rawDetails, targetRole } = payload;

      parts = [{
        text: `Convert the following casual work notes into exactly 3 strong, ATS-compliant bullet points using the Google X-Y-Z formula (Accomplished [X], measured by [Y], by doing [Z]).
Role: ${role || 'Professional'}
Company: ${company || 'Company'}
Target Role: ${targetRole || 'Professional'}
Notes: "${rawDetails}"

Strict Instructions:
1. Return ONLY a valid JSON array of 3 strings.
2. Example format: ["bullet 1", "bullet 2", "bullet 3"]
3. Output raw JSON only.`
      }];
    } else if (action === 'parse-resume') {
      const { fileBase64, mimeType, resumeText } = payload;

      const promptText = `Extract the resume information into this exact JSON structure:
{
  "personalInfo": {
    "fullName": "",
    "email": "",
    "phone": "",
    "location": "",
    "targetRole": "",
    "yearsOfExperience": "1-2 years",
    "experienceField": "",
    "summary": ""
  },
  "links": [{ "id": "1", "platform": "LinkedIn", "url": "https://..." }],
  "skills": [{ "id": "1", "name": "Skill", "level": "Professional" }],
  "experiences": [{
    "id": "1",
    "company": "",
    "role": "",
    "startDate": "",
    "endDate": "",
    "isCurrent": false,
    "rawDetails": "",
    "enhancedBullets": ["bullet 1"]
  }],
  "education": [{
    "id": "1",
    "institution": "",
    "degree": "",
    "fieldOfStudy": "",
    "graduationYear": "",
    "scoreOrGpa": ""
  }],
  "projects": [{
    "id": "1",
    "title": "",
    "techStack": ["React"],
    "description": ""
  }]
}

Rules:
- Return ONLY valid JSON.
- If data for a field is missing, provide a reasonable default or empty string.`;

      if (fileBase64 && mimeType) {
        parts = [
          {
            inlineData: {
              mimeType: mimeType,
              data: fileBase64,
            },
          },
          { text: promptText },
        ];
      } else {
        parts = [{ text: `${promptText}\n\nResume content:\n"""\n${resumeText}\n"""` }];
      }
    } else {
      return NextResponse.json({ error: 'Invalid action provided.' }, { status: 400 });
    }

    let generatedText = '';
    let lastError: any = null;

    // Retry loop with model fallback and delay handling for high demand (503)
    for (const model of MODELS) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts }],
                generationConfig:
                  action === 'parse-resume' || action === 'enhance-experience'
                    ? { responseMimeType: 'application/json' }
                    : undefined,
              }),
            }
          );

          const data = await response.json();

          if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
            generatedText = data.candidates[0].content.parts[0].text.trim();
            break;
          } else {
            lastError = data.error?.message || `Request failed on ${model}`;
            // If 503 high demand, pause briefly before retrying
            if (response.status === 503) {
              await sleep(800 * (attempt + 1));
            }
          }
        } catch (err: any) {
          lastError = err.message;
          await sleep(500);
        }
      }

      if (generatedText) break;
    }

    if (!generatedText) {
      throw new Error(lastError || 'Service temporarily busy. Please retry in a few moments.');
    }

    if (action === 'generate-summary') {
      return NextResponse.json({ result: generatedText });
    }

    const cleanJson = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      const parsed = JSON.parse(cleanJson);
      return NextResponse.json({ result: parsed });
    } catch {
      if (action === 'enhance-experience') {
        const fallbackLines = generatedText
          .split('\n')
          .map((l: string) => l.replace(/^[-*•\d.]\s*/, '').trim())
          .filter((l: string) => l.length > 5)
          .slice(0, 3);
        return NextResponse.json({ result: fallbackLines });
      }
      throw new Error('Failed to parse AI output into JSON.');
    }
  } catch (error: any) {
    console.error('AI Route Handler Error:', error);
    return NextResponse.json({ error: error?.message || 'Internal AI Error' }, { status: 500 });
  }
}
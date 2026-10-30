import type { ResumeData } from '@/types/resume';
import { callAi } from '@/utils/aiClient';
import { normalizeResumeData } from '@/utils/normalizeResumeData';

export const MAX_RESUME_PDF_BYTES = 8 * 1024 * 1024;
const MAX_TEXT_FILE_BYTES = 1_000_000;
const MAX_JOB_DESCRIPTION_CHARS = 30_000;

// `what` names the document in error messages ("resume", "job description").
export async function validatePdf(file: File, what = 'resume'): Promise<void> {
  const looksLikePdf =
    file.name.toLowerCase().endsWith('.pdf') ||
    file.type === 'application/pdf' ||
    file.type === 'application/x-pdf';
  if (!looksLikePdf) throw new Error(`Choose a PDF ${what} (.pdf) to continue.`);
  if (file.size === 0) throw new Error('The selected PDF is empty.');
  if (file.size > MAX_RESUME_PDF_BYTES) throw new Error('The PDF must be smaller than 8 MB.');

  // Every real PDF starts with "%PDF-". This catches renamed Word or image files early.
  const header = await file.slice(0, 5).text();
  if (header !== '%PDF-') {
    throw new Error(`This file is not a readable PDF. Export your ${what} as PDF and try again.`);
  }
}

export const validateResumePdf = (file: File) => validatePdf(file, 'resume');

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.includes(',') ? result.slice(result.indexOf(',') + 1) : '';
      if (!base64) reject(new Error('Could not read the selected PDF.'));
      else resolve(base64);
    };
    reader.onerror = () => reject(new Error('Could not read the selected PDF.'));
    reader.readAsDataURL(file);
  });
}

export async function parseResumePdf(file: File): Promise<ResumeData> {
  await validateResumePdf(file);
  const base64Pdf = await fileToBase64(file);
  const result = await callAi<unknown>('parse-resume-pdf', { base64Pdf, fileName: file.name });
  return normalizeResumeData(result);
}

const isTextFile = (file: File) => /\.(txt|md)$/i.test(file.name) || file.type.startsWith('text/');

// A job description from a .txt / .md file (read in the browser) or a PDF
// (transcribed by the AI route, which counts as one AI request).
export async function readJobDescriptionFile(file: File): Promise<string> {
  if (isTextFile(file)) {
    if (file.size > MAX_TEXT_FILE_BYTES) throw new Error('Job description files must be smaller than 1 MB.');
    return (await file.text()).trim().slice(0, MAX_JOB_DESCRIPTION_CHARS);
  }
  await validatePdf(file, 'job description');
  const base64Pdf = await fileToBase64(file);
  const result = await callAi<{ text: string }>('read-job-pdf', { base64Pdf });
  return result.text.slice(0, MAX_JOB_DESCRIPTION_CHARS);
}

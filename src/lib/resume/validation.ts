// Input checks shared by the editor and the analyzer.

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15 && /^[+\d\s().-]+$/.test(value.trim());
}

// Accepts "linkedin.com/in/me" as well as full URLs.
export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function isValidUrl(value: string): boolean {
  if (!value.trim()) return false;
  try {
    const url = new URL(normalizeUrl(value));
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.');
  } catch {
    return false;
  }
}

// Only http(s) and mailto links may become clickable on a resume.
export function safeHref(value: string): string | null {
  const trimmed = value.trim();
  if (/^mailto:/i.test(trimmed)) return trimmed;
  return isValidUrl(trimmed) ? normalizeUrl(trimmed) : null;
}

export const wordCount = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;

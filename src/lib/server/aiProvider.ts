import { GoogleGenAI } from '@google/genai';
import type { Feature } from '@/lib/entitlements';
import { hasOwnOpenRouterModel, openRouterModelsFor, usesBackupModels } from '@/lib/server/aiModels';

// Talks to the AI provider (Gemini or OpenRouter). Used by every server route
// that needs AI, so model choice, retries, and logging stay in one place.

export const aiProvider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const openRouterApiKey = process.env.OPENROUTER_API_KEY || '';
const ai = new GoogleGenAI({ apiKey: geminiApiKey });
const DEFAULT_MODEL = 'gemini-3.8-flash';
const FALLBACK_MODEL = 'gemini-3.1-flash-lite';
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;
// OpenRouter models that answered "reasoning is mandatory" (remembered per server instance).
const modelsThatMustReason = new Set<string>();
const REASONING_TOKEN_ALLOWANCE = 1024;
// A tool's own model gets this long before the main model takes over.
const OWN_MODEL_TIMEOUT_MS = 25_000;


export class AiProviderError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'AiProviderError';
  }
}

export function getHttpStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    return typeof error.status === 'number' ? error.status : undefined;
  }

  return undefined;
}

// 500/503: the model is busy, so wait and retry the same model.
const RETRYABLE_STATUSES = new Set([500, 503]);
// 404/429: this model is missing or out of quota, so move straight to the fallback model.
const SWITCH_MODEL_STATUSES = new Set([404, 429]);

async function generateWithFallback<T>(
  generate: (model: string) => Promise<T>
): Promise<T> {
  let lastError: unknown;
  const models = [DEFAULT_MODEL, FALLBACK_MODEL];

  for (const model of models) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      try {
        return await generate(model);
      } catch (error) {
        lastError = error;
        const status = getHttpStatus(error);
        if (status !== undefined && SWITCH_MODEL_STATUSES.has(status)) break;
        if (status === undefined || !RETRYABLE_STATUSES.has(status)) throw error;

        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) =>
            setTimeout(resolve, RETRY_DELAY_MS * 2 ** attempt)
          );
        }
      }
    }

    if (model !== FALLBACK_MODEL) {
      console.warn(`Gemini model ${model} is unavailable; trying ${FALLBACK_MODEL}.`);
    }
  }

  throw lastError;
}

export interface GenerateOptions {
  // Picks the OpenRouter model for the tool (see src/lib/server/aiModels.ts).
  feature?: Feature | null;
  action?: string;
  base64Pdf?: string;
  pdfName?: string;
  maxTokens?: number;
  timeoutMs?: number;
  jsonMode?: boolean;
}

export async function generateText(prompt: string, options: GenerateOptions = {}): Promise<string> {
  if (aiProvider === 'openrouter') {
    if (!openRouterApiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured in environment variables.');
    }

    const models = openRouterModelsFor(options.feature ?? null);
    const content = options.base64Pdf
      ? [
          { type: 'text', text: prompt },
          {
            type: 'file',
            file: {
              filename: options.pdfName ?? 'resume.pdf',
              file_data: `data:application/pdf;base64,${options.base64Pdf}`,
            },
          },
        ]
      : prompt;
    // Reasoning is turned off for speed. Some models refuse that; for them, use
    // brief hidden reasoning with extra room for it in the token budget.
    let mustReason = modelsThatMustReason.has(models[0]);
    const buildRequestBody = () => ({
      model: models[0],
      ...(models.length > 1 ? { models, route: 'fallback' as const } : {}),
      messages: [{ role: 'user', content }],
      max_tokens: (options.maxTokens ?? 1200) + (mustReason ? REASONING_TOKEN_ALLOWANCE : 0),
      reasoning: mustReason ? { effort: 'low', exclude: true } : { effort: 'none', exclude: true },
      // Models that support it return strict JSON; others ignore this field.
      ...(options.jsonMode ? { response_format: { type: 'json_object' } } : {}),
      ...(options.base64Pdf
        ? { plugins: [{ id: 'file-parser', pdf: { engine: 'cloudflare-ai' } }] }
        : {}),
    });

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      const requestBody = buildRequestBody();
      let response: Response;
      try {
        response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openRouterApiKey}`,
            'Content-Type': 'application/json',
            'X-OpenRouter-Title': 'AI Resume Studio',
            ...(process.env.NEXT_PUBLIC_SITE_URL
              ? { 'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL }
              : {}),
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(options.timeoutMs ?? 50_000),
        });
      } catch (error) {
        if (error instanceof Error && error.name === 'TimeoutError') {
          throw new AiProviderError('The AI provider took too long to respond. Please try again.', 504);
        }
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) =>
            setTimeout(resolve, RETRY_DELAY_MS * 2 ** attempt)
          );
          continue;
        }
        throw error;
      }

      // Gateways sometimes answer with an HTML or plain-text error page
      let data: unknown = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }
      const providerMessage =
        typeof data === 'object' &&
        data !== null &&
        'error' in data &&
        typeof data.error === 'object' &&
        data.error !== null &&
        'message' in data.error &&
        typeof data.error.message === 'string'
          ? data.error.message
          : null;
      if (!response.ok) {
        const message = providerMessage ?? 'OpenRouter could not complete the AI request.';
        if (response.status === 400 && !mustReason && /reasoning is mandatory|cannot be disabled/i.test(message)) {
          modelsThatMustReason.add(models[0]);
          mustReason = true;
          continue;
        }
        const error = new AiProviderError(message, response.status);
        if (![429, 502, 503, 504].includes(response.status) || attempt === MAX_RETRIES) {
          throw error;
        }
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY_MS * 2 ** attempt)
        );
        continue;
      }

      if (
        typeof data !== 'object' ||
        data === null ||
        !('choices' in data) ||
        !Array.isArray(data.choices)
      ) {
        // Free models sometimes answer "200 OK" with only an error inside.
        // 502 shows the user the friendly "AI service is busy" message.
        throw new AiProviderError(
          providerMessage ? `OpenRouter: ${providerMessage}` : 'OpenRouter returned an unexpected response.',
          502
        );
      }

      // Which model answered (the tool's own, or a backup). No request content is logged.
      const usedModel = 'model' in data && typeof data.model === 'string' ? data.model : models[0];
      console.info(`[ai] ${options.action ?? 'request'} → ${usedModel}`);

      const message = data.choices[0]?.message;
      const responseContent =
        typeof message === 'object' && message !== null && 'content' in message
          ? message.content
          : undefined;
      if (typeof responseContent === 'string') return responseContent.trim();
      if (Array.isArray(responseContent)) {
        return responseContent
          .filter(
            (part): part is { type: string; text: string } =>
              typeof part === 'object' &&
              part !== null &&
              'text' in part &&
              typeof part.text === 'string'
          )
          .map((part) => part.text)
          .join('')
          .trim();
      }
      throw new Error('OpenRouter returned an empty AI response.');
    }

    throw new Error('OpenRouter could not complete the AI request after retries.');
  }

  if (aiProvider !== 'gemini') {
    throw new Error(`Unsupported AI_PROVIDER "${aiProvider}". Use "gemini" or "openrouter".`);
  }
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }

  const contents = options.base64Pdf
    ? [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: options.base64Pdf,
              },
            },
            { text: prompt },
          ],
        },
      ]
    : prompt;

  const response = await generateWithFallback((model) =>
    ai.models.generateContent({
      model,
      contents,
      config: {
        maxOutputTokens: options.maxTokens ?? 1200,
        ...(options.jsonMode ? { responseMimeType: 'application/json' } : {}),
      },
    })
  );
  return response.text?.trim() || '';
}

// Safely extracts valid JSON structures from raw model outputs
export function extractCleanJson<T>(rawText: string): T {
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
  } catch {
    // Never log the text itself: it can contain a person's resume (PRD §23).
    console.error(`JSON extraction failed (${rawText.length} characters of AI output).`);
    throw new Error('AI output formatting error. Please try again.');
  }
}


export type ToolGenerator = (prompt: string, options?: GenerateOptions) => Promise<string>;

// Every AI call for a tool goes through this: the tool's own model first, then
// the main model if it fails or returns unusable JSON. The first try is kept
// short so the second one still fits in the 60-second limit. A tool that uses one
// model only (usesBackupModels) skips the second try and reports the failure.
export function createToolGenerator(feature: Feature, action: string): ToolGenerator {
  const ownModel = aiProvider === 'openrouter' && hasOwnOpenRouterModel(feature) && usesBackupModels(feature);
  return async (prompt, options = {}) => {
    if (!ownModel) return generateText(prompt, { ...options, feature, action });
    const deadline = Date.now() + 57_000;
    try {
      const raw = await generateText(prompt, {
        ...options,
        feature,
        action,
        timeoutMs: Math.min(options.timeoutMs ?? 50_000, OWN_MODEL_TIMEOUT_MS),
      });
      if (options.jsonMode) extractCleanJson(raw);
      return raw;
    } catch (error) {
      console.info(`[ai] ${action}: the tool's model failed (${error instanceof Error ? error.message.slice(0, 120) : 'unknown error'}); using the main model`);
      return generateText(prompt, {
        ...options,
        feature: null,
        action,
        timeoutMs: Math.max(5_000, Math.min(options.timeoutMs ?? 50_000, deadline - Date.now())),
      });
    }
  };
}

// Signs and encrypts server-side tokens. Never sent to the browser.
export function getServerSecret(): string {
  return process.env.AI_SYNC_TOKEN_SECRET || openRouterApiKey || geminiApiKey;
}

// Maps a thrown error to the JSON the routes return. Logs the error type and
// message only — never request content (PRD §23).
export function aiErrorResponse(err: unknown): { body: { error: string }; status: number } {
  console.error('AI route error:', err instanceof Error ? `${err.name}: ${err.message}` : 'unknown error');
  const status = getHttpStatus(err);
  const isUnavailable = status === 429 || status === 502 || status === 503 || status === 504;
  return {
    body: {
      error: isUnavailable
        ? 'The AI service is temporarily busy. Please try again shortly.'
        : err instanceof Error
          ? err.message
          : 'Internal AI Server Error',
    },
    status: isUnavailable ? status! : 500,
  };
}

export function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function readStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
    : [];
}

// Keeps prompts (and AI cost) bounded. A full, detailed resume is far below this.
const MAX_RESUME_JSON_CHARS = 60_000;

export function isResumePayload(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  try {
    return JSON.stringify(value).length <= MAX_RESUME_JSON_CHARS;
  } catch {
    return false;
  }
}

export function isValidJobDescription(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length >= 80 && value.length <= 30_000;
}

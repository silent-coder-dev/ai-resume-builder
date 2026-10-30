import type { Feature } from '@/lib/entitlements';

// Optional OpenRouter model per tool, to spread requests across models.
// A tool without its own model uses OPENROUTER_MODEL.
const FEATURE_MODEL_ENV: Partial<Record<Feature, string>> = {
  aiAnalysis: 'OPENROUTER_MODEL_ANALYZER',
  jobMatch: 'OPENROUTER_MODEL_JOB_MATCH',
  interviewPrep: 'OPENROUTER_MODEL_INTERVIEW',
};

export const DEFAULT_OPENROUTER_MODEL = 'google/gemini-2.5-flash';

type Env = Record<string, string | undefined>;

const clean = (value: string | undefined) => value?.trim() ?? '';

// The models to try, in order and without repeats: the tool's own model, then
// the main model, then OPENROUTER_FALLBACK_MODELS. OpenRouter moves to the next
// one when a model is busy, rate limited, or missing, so a tool never depends
// on a single free model.
export function openRouterModelsFor(feature: Feature | null, env: Env = process.env): string[] {
  const main = clean(env.OPENROUTER_MODEL) || DEFAULT_OPENROUTER_MODEL;
  const envName = feature ? FEATURE_MODEL_ENV[feature] : undefined;
  const preferred = envName ? clean(env[envName]) : '';
  const fallbacks = clean(env.OPENROUTER_FALLBACK_MODELS)
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);
  return [...new Set([preferred || main, main, ...fallbacks])];
}

// True when the tool has its own model, different from the main one.
export function hasOwnOpenRouterModel(feature: Feature | null, env: Env = process.env): boolean {
  return openRouterModelsFor(feature, env)[0] !== openRouterModelsFor(null, env)[0];
}

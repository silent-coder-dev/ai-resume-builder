// Feature policies (PRD §2.3, §21). At launch there is one plan and every
// feature is free. A future paid plan only needs a new entry here — no
// payment screens, banners, or locks exist in the app today.

export type Feature =
  | 'resumeBuilder'
  | 'templates'
  | 'pdfExport'
  | 'jsonBackup'
  | 'aiWriting'
  | 'aiAnalysis'
  | 'jobMatch'
  | 'githubImport'
  | 'interviewPrep';

export interface PlanPolicy {
  id: 'free';
  label: string;
  features: Record<Feature, boolean>;
  // Protects AI costs. Communicated on the Settings page; never charged.
  aiRequestsPerMinute: number;
  aiRequestsPerDay: number;
}

function readLimit(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export function getPlanPolicy(): PlanPolicy {
  return {
    id: 'free',
    label: 'Free',
    features: {
      resumeBuilder: true,
      templates: true,
      pdfExport: true,
      jsonBackup: true,
      aiWriting: true,
      aiAnalysis: true,
      jobMatch: true,
      githubImport: true,
      interviewPrep: true,
    },
    aiRequestsPerMinute: readLimit(process.env.AI_RATE_LIMIT_PER_MINUTE, 10),
    aiRequestsPerDay: readLimit(process.env.AI_RATE_LIMIT_PER_DAY, 150),
  };
}

export function isFeatureEnabled(feature: Feature, plan: PlanPolicy = getPlanPolicy()): boolean {
  return plan.features[feature];
}

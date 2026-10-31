import type { ResumeData } from '@/types/resume';

export type InterviewRound = 'mixed' | 'technical' | 'hr';
export type InterviewLevel = 'friendly' | 'standard' | 'tough';

export interface InterviewSetup {
  resumeData: ResumeData;
  jobDescription: string;
  targetRole: string;
  round: InterviewRound;
  level: InterviewLevel;
  count: number;
  lang: string;
}

export interface PlanQuestion {
  id: string;
  focus: string;
  question: string;
  requirement: string;
  evidence: 'shown' | 'partial' | 'gap' | null;
  whyAsked: string;
}

export interface InterviewPlan {
  jobTitle: string;
  greeting: string;
  closing: string;
  questions: PlanQuestion[];
}

export interface AnswerRatings {
  accuracy: number;
  clarity: number;
  completeness: number;
  communication: number;
}

export interface AnswerFeedback {
  spokenReply: string;
  ratings: AnswerRatings;
  strengths: string[];
  improvements: string[];
  youCouldSay: string;
  followUp: string;
}

export interface InterviewTurn {
  id: string;
  focus: string;
  question: string;
  requirement: string;
  evidence: PlanQuestion['evidence'];
  whyAsked: string;
  isFollowUp: boolean;
  answer: string;
  skipped: boolean;
  seconds: number;
  feedback: AnswerFeedback | null;
}

export interface InterviewResult {
  setup: InterviewSetup;
  plan: InterviewPlan;
  turns: InterviewTurn[];
  seconds: number;
}

export const RATING_LABELS: Array<{ key: keyof AnswerRatings; label: string }> = [
  { key: 'accuracy', label: 'Accuracy' },
  { key: 'clarity', label: 'Clarity' },
  { key: 'completeness', label: 'Completeness' },
  { key: 'communication', label: 'Communication' },
];

// 0 to 100 from the four ratings; a skipped question counts as zero, as it would
// in a real interview. Answers without feedback (AI unavailable) are left out.
export function interviewScore(turns: Array<Pick<InterviewTurn, 'skipped' | 'feedback'>>): number {
  const scored = turns.filter((turn) => turn.skipped || turn.feedback);
  if (scored.length === 0) return 0;
  const total = scored.reduce((sum, turn) => {
    if (!turn.feedback) return sum;
    const { accuracy, clarity, completeness, communication } = turn.feedback.ratings;
    return sum + (accuracy + clarity + completeness + communication) / 20;
  }, 0);
  return Math.round((total / scored.length) * 100);
}

export function averageRating(turns: InterviewTurn[], key: keyof AnswerRatings): number | null {
  const rated = turns.filter((turn) => turn.feedback);
  if (rated.length === 0) return null;
  return rated.reduce((sum, turn) => sum + (turn.feedback?.ratings[key] ?? 0), 0) / rated.length;
}

export const formatClock = (totalSeconds: number) => {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = String(seconds % 60).padStart(2, '0');
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`;
};

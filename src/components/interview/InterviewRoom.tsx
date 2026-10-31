'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  Clock,
  Keyboard,
  LogOut,
  Maximize,
  Mic,
  MicOff,
  SkipForward,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { saveSnapshot } from '@/lib/assessment/session';
import { callAi } from '@/utils/aiClient';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { AiInterviewer, type InterviewerState } from '@/components/interview/AiInterviewer';
import { useImmersive } from '@/components/interview/useImmersive';
import { MIC_PROBLEM_TEXT, isSpeechInputSupported, useInterviewerVoice, useSpeechInput } from '@/components/interview/useSpeech';
import {
  RATING_LABELS,
  formatClock,
  type AnswerFeedback,
  type InterviewPlan,
  type InterviewResult,
  type InterviewSetup,
  type InterviewTurn,
  type PlanQuestion,
} from '@/components/interview/types';

export const INTERVIEW_SNAPSHOT_KEY = 'ai-resume-studio:interview-session';
const MAX_FOLLOW_UPS = 2;

export interface InterviewSnapshot {
  setup: InterviewSetup;
  plan: InterviewPlan;
  turns: InterviewTurn[];
  nextIndex: number;
  seconds: number;
}

type Phase = 'preparing' | 'failed' | 'intro' | 'asking' | 'answering' | 'evaluating' | 'feedback' | 'closing';

const toTurn = (question: PlanQuestion): InterviewTurn => ({
  ...question,
  isFollowUp: false,
  answer: '',
  skipped: false,
  seconds: 0,
  feedback: null,
});

const EVIDENCE_TEXT = {
  shown: { label: 'On your resume', tone: 'bg-emerald-400/15 text-emerald-300' },
  partial: { label: 'Partly on your resume', tone: 'bg-amber-400/15 text-amber-300' },
  gap: { label: 'Not on your resume', tone: 'bg-rose-400/15 text-rose-300' },
};

function SelfView({ onError }: { onError: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // The picture stays on this screen: it is never recorded or sent anywhere.
  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    void navigator.mediaDevices
      ?.getUserMedia({ video: { width: 320, height: 240 }, audio: false })
      .then((media) => {
        if (cancelled) {
          media.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = media;
        if (videoRef.current) videoRef.current.srcObject = media;
      })
      .catch(onError);
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [onError]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      aria-label="Your camera (only you can see this)"
      className="absolute bottom-3 right-3 h-24 w-32 rounded-xl border border-white/15 object-cover shadow-lg [transform:scaleX(-1)] sm:h-32 sm:w-44"
    />
  );
}

export function InterviewRoom({
  setup,
  resume,
  wantsFullscreen,
  onFinish,
  onExit,
}: {
  setup: InterviewSetup;
  resume: InterviewSnapshot | null;
  wantsFullscreen: boolean;
  onFinish: (result: InterviewResult) => void;
  onExit: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { fullscreen, supported, enter } = useImmersive(rootRef);

  const [phase, setPhase] = useState<Phase>('preparing');
  const [plan, setPlan] = useState<InterviewPlan | null>(resume?.plan ?? null);
  const [turns, setTurns] = useState<InterviewTurn[]>(resume?.turns ?? []);
  const [current, setCurrent] = useState<InterviewTurn | null>(null);
  const [answer, setAnswer] = useState('');
  const [caption, setCaption] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(resume?.seconds ?? 0);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [camera, setCamera] = useState(false);

  // Values the async interview flow reads after it has been waiting.
  const nextIndexRef = useRef(resume?.nextIndex ?? 0);
  const [asked, setAsked] = useState(resume?.nextIndex ?? 0);
  const elapsedRef = useRef(resume?.seconds ?? 0);
  const questionStartRef = useRef(0);
  const flowRef = useRef(0);
  const startedRef = useRef(false);

  const voice = useInterviewerVoice(setup.lang);
  const { speak, stop: stopVoice } = voice;
  const appendText = useCallback((text: string) => {
    if (text) setAnswer((previous) => (previous ? `${previous} ${text}` : text));
  }, []);
  const mic = useSpeechInput(setup.lang, appendText);
  const { start: startMic, stop: stopMic } = mic;

  const avatarState: InterviewerState = voice.speaking
    ? 'speaking'
    : phase === 'answering'
      ? mic.listening
        ? 'listening'
        : 'idle'
      : phase === 'preparing' || phase === 'evaluating'
        ? 'thinking'
        : 'idle';

  useEffect(() => {
    const timer = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // A reload mid-interview comes back to the next question.
  useEffect(() => {
    if (plan) saveSnapshot(INTERVIEW_SNAPSHOT_KEY, { setup, plan, turns, nextIndex: nextIndexRef.current, seconds: elapsedRef.current } satisfies InterviewSnapshot);
  }, [plan, turns, setup, current]);

  const say = useCallback(
    async (text: string) => {
      setCaption(text);
      await speak(text);
    },
    [speak]
  );

  const finish = useCallback(
    (finalPlan: InterviewPlan, finalTurns: InterviewTurn[]) => {
      flowRef.current += 1;
      stopVoice();
      stopMic();
      onFinish({ setup, plan: finalPlan, turns: finalTurns, seconds: elapsedRef.current });
    },
    [onFinish, setup, stopMic, stopVoice]
  );

  const askTurn = useCallback(
    async (turn: InterviewTurn) => {
      const flow = (flowRef.current += 1);
      stopMic();
      setCurrent(turn);
      setAnswer('');
      setError(null);
      setPhase('asking');
      await say(turn.question);
      if (flow !== flowRef.current) return;
      questionStartRef.current = elapsedRef.current;
      setPhase('answering');
      startMic();
    },
    [say, startMic, stopMic]
  );

  const askNextOrClose = useCallback(
    async (activePlan: InterviewPlan, doneTurns: InterviewTurn[]) => {
      const next = activePlan.questions[nextIndexRef.current];
      if (next) {
        nextIndexRef.current += 1;
        setAsked(nextIndexRef.current);
        await askTurn(toTurn(next));
        return;
      }
      const flow = (flowRef.current += 1);
      setCurrent(null);
      setPhase('closing');
      await say(activePlan.closing);
      if (flow === flowRef.current) finish(activePlan, doneTurns);
    },
    [askTurn, finish, say]
  );

  const prepare = useCallback(async () => {
    const flow = (flowRef.current += 1);
    try {
      const made = await callAi<InterviewPlan>('interview-plan', {
        resumeData: setup.resumeData,
        jobDescription: setup.jobDescription,
        targetRole: setup.targetRole,
        round: setup.round,
        level: setup.level,
        count: setup.count,
      });
      if (flow !== flowRef.current) return;
      setPlan(made);
      setPhase('intro');
      await say(made.greeting);
      if (flow === flowRef.current) await askNextOrClose(made, []);
    } catch (caught) {
      if (flow !== flowRef.current) return;
      setError(caught instanceof Error ? caught.message : 'The interview could not be prepared.');
      setPhase('failed');
    }
  }, [askNextOrClose, say, setup]);

  // Start once. The flow runs asynchronously from here on.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void (async () => {
      await null;
      if (resume) await askNextOrClose(resume.plan, resume.turns);
      else await prepare();
    })();
  }, [askNextOrClose, prepare, resume]);

  useEffect(() => {
    const active = flowRef;
    return () => {
      active.current += 1;
    };
  }, []);

  const recordTurn = (turn: InterviewTurn) => {
    const updated = [...turns, turn];
    setTurns(updated);
    return updated;
  };

  const submitAnswer = async () => {
    if (!current || !plan) return;
    const text = [answer, mic.interim].filter(Boolean).join(' ').trim();
    if (!text) {
      setError('Say or type an answer first, or skip this question.');
      return;
    }
    stopMic();
    setAnswer(text);
    setError(null);
    setPhase('evaluating');
    const flow = (flowRef.current += 1);
    const seconds = elapsedRef.current - questionStartRef.current;
    const followUpsUsed = turns.filter((turn) => turn.isFollowUp).length;
    try {
      const feedback = await callAi<AnswerFeedback>('interview-answer', {
        resumeData: setup.resumeData,
        jobDescription: setup.jobDescription,
        jobTitle: plan.jobTitle || setup.targetRole,
        question: current.question,
        answer: text,
        allowFollowUp: !current.isFollowUp && followUpsUsed < MAX_FOLLOW_UPS,
      });
      if (flow !== flowRef.current) return;
      const done: InterviewTurn = { ...current, answer: text, seconds, feedback };
      setCurrent(done);
      recordTurn(done);
      setPhase('feedback');
      await say(feedback.spokenReply);
    } catch (caught) {
      if (flow !== flowRef.current) return;
      setError(caught instanceof Error ? caught.message : 'Your answer could not be reviewed.');
      setPhase('answering');
    }
  };

  // The AI is down, but the interview shouldn't have to stop.
  const continueWithoutFeedback = () => {
    if (!current || !plan) return;
    const updated = recordTurn({ ...current, answer: answer.trim(), seconds: elapsedRef.current - questionStartRef.current });
    void askNextOrClose(plan, updated);
  };

  const skipQuestion = () => {
    if (!current || !plan) return;
    const updated = recordTurn({ ...current, skipped: true, answer: '', seconds: elapsedRef.current - questionStartRef.current });
    void askNextOrClose(plan, updated);
  };

  const continueInterview = () => {
    if (!current || !plan) return;
    stopVoice();
    const followUp = current.feedback?.followUp;
    if (followUp) {
      void askTurn({
        id: `${current.id}-follow-up`,
        focus: 'Follow-up',
        question: followUp,
        requirement: current.requirement,
        evidence: null,
        whyAsked: '',
        isFollowUp: true,
        answer: '',
        skipped: false,
        seconds: 0,
        feedback: null,
      });
      return;
    }
    void askNextOrClose(plan, turns);
  };

  const skipVoice = () => {
    stopVoice();
  };

  const total = plan?.questions.length ?? setup.count;

  return createPortal(
    <div ref={rootRef} className="fixed inset-0 z-[90] flex flex-col bg-slate-950 text-slate-100" aria-label="AI interview room">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-body font-semibold">{plan?.jobTitle || setup.targetRole || 'AI Interview'}</p>
          <p className="text-label text-slate-400">
            {phase === 'preparing' ? 'Getting ready' : phase === 'closing' ? 'Finishing up' : `Question ${Math.max(1, asked)} of ${total}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="mr-1 hidden items-center gap-1.5 text-small tabular-nums text-slate-300 sm:flex">
            <Clock className="h-4 w-4 text-slate-500" aria-hidden="true" /> {formatClock(elapsed)}
          </span>
          <button
            type="button"
            onClick={voice.toggleMuted}
            aria-pressed={voice.muted}
            aria-label={voice.muted ? 'Turn the interviewer’s voice on' : 'Mute the interviewer’s voice'}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10"
          >
            {voice.muted ? <VolumeX className="h-4 w-4" aria-hidden="true" /> : <Volume2 className="h-4 w-4" aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={() => setCamera((previous) => !previous)}
            aria-pressed={camera}
            aria-label={camera ? 'Turn your camera preview off' : 'Turn your camera preview on'}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10"
          >
            {camera ? <Video className="h-4 w-4" aria-hidden="true" /> : <VideoOff className="h-4 w-4" aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={() => setConfirmEnd(true)}
            className="ml-1 flex h-9 items-center gap-1.5 rounded-lg bg-rose-500/15 px-3 text-small font-semibold text-rose-300 hover:bg-rose-500/25"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" /> End
          </button>
        </div>
      </header>

      {wantsFullscreen && supported && !fullscreen && (
        <div className="flex shrink-0 items-center justify-center gap-3 bg-amber-400/10 px-4 py-2 text-small text-amber-200">
          You left full screen.
          <button type="button" onClick={() => void enter()} className="flex items-center gap-1.5 font-semibold underline underline-offset-2">
            <Maximize className="h-3.5 w-3.5" aria-hidden="true" /> Return to full screen
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        {/* The interviewer */}
        <section className="relative flex shrink-0 flex-col items-center justify-end overflow-hidden bg-[radial-gradient(ellipse_at_50%_20%,#1e2547_0%,#0b1020_70%)] px-4 pt-4 lg:min-w-0 lg:flex-1">
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-label backdrop-blur">
            <span
              className={`h-2 w-2 rounded-full ${
                avatarState === 'speaking' ? 'bg-indigo-400' : avatarState === 'listening' ? 'bg-emerald-400' : avatarState === 'thinking' ? 'bg-amber-400' : 'bg-slate-500'
              }`}
              aria-hidden="true"
            />
            <span className="font-medium">Aria</span>
            <span className="text-slate-400">AI Interviewer</span>
          </div>

          <AiInterviewer state={avatarState} className="h-[34dvh] w-full max-w-md lg:h-[82dvh] lg:max-w-3xl" />

          <div className="relative z-10 mb-4 min-h-14 w-full max-w-2xl rounded-xl bg-black/60 lg:absolute lg:bottom-1 lg:left-1/2 lg:-translate-x-1/2 lg:w-[calc(100%-3rem)] px-4 py-2.5 text-center text-small leading-6 text-slate-100 backdrop-blur lg:text-body" aria-live="polite">
            {phase === 'preparing' ? 'Reading your resume and the job requirements…' : phase === 'evaluating' ? 'Considering your answer…' : caption}
          </div>

          {camera && <SelfView onError={() => setCamera(false)} />}
        </section>

        {/* The conversation */}
        <aside className="flex min-h-0 w-full shrink-0 flex-col border-t border-white/10 bg-slate-900/60 lg:w-[28rem] lg:border-l lg:border-t-0 xl:w-[32rem]">
          <div className="min-h-0 flex-1 p-4 sm:p-5 lg:overflow-y-auto">
            {phase === 'failed' && (
              <div className="space-y-3">
                <h2 className="text-card font-semibold">The interview could not start</h2>
                <p className="text-small text-slate-300">{error}</p>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    onClick={() => {
                      setPhase('preparing');
                      setError(null);
                      setCaption('');
                      void prepare();
                    }}
                  >
                    Try again
                  </Button>
                  <button type="button" onClick={onExit} className="rounded-lg px-4 text-body font-semibold text-slate-300 hover:bg-white/10">Exit</button>
                </div>
              </div>
            )}

            {(phase === 'preparing' || phase === 'intro' || phase === 'closing') && (
              <p className="text-small text-slate-400">
                {phase === 'closing' ? 'That was the last question. Your report is next.' : 'Find a quiet place. Questions come one at a time, and you’ll get feedback after each answer.'}
              </p>
            )}

            {current && phase !== 'closing' && phase !== 'failed' && (
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-indigo-400/15 px-2 py-0.5 text-label font-medium text-indigo-300">{current.focus}</span>
                  {current.evidence && (
                    <span className={`rounded-md px-2 py-0.5 text-label font-medium ${EVIDENCE_TEXT[current.evidence].tone}`}>{EVIDENCE_TEXT[current.evidence].label}</span>
                  )}
                  {current.requirement && <span className="text-label text-slate-400">Job requirement: {current.requirement}</span>}
                </div>
                <h2 className="mt-2 text-card font-semibold leading-6" aria-live="polite">{current.question}</h2>
              </div>
            )}

            {phase === 'asking' && (
              <button type="button" onClick={skipVoice} className="mt-3 text-small font-semibold text-indigo-300 hover:underline">
                Skip the voice and answer now
              </button>
            )}

            {phase === 'answering' && (
              <div className="mt-4">
                {mic.problem && <p className="mb-3 rounded-lg bg-amber-400/10 px-3 py-2 text-small text-amber-200">{MIC_PROBLEM_TEXT[mic.problem]}</p>}
                <label htmlFor="interview-answer" className="mb-1.5 flex items-center justify-between text-label font-medium text-slate-300">
                  Your answer
                  {mic.listening && (
                    <span className="flex items-center gap-2 text-emerald-300">
                      <span className="ai-wave flex h-3.5 items-center gap-0.5" aria-hidden="true">
                        <span /><span /><span /><span /><span />
                      </span>
                      Listening
                    </span>
                  )}
                </label>
                <textarea
                  id="interview-answer"
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  rows={7}
                  maxLength={6000}
                  placeholder={mic.listening ? 'Speak now. Your words appear here, and you can correct them.' : 'Turn on the microphone, or type your answer.'}
                  className="w-full resize-y rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-body leading-6 text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                />
                {mic.interim && <p className="mt-1.5 text-small italic text-slate-400">{mic.interim}</p>}
                {error && <p role="alert" className="mt-2 text-small text-rose-300">{error}</p>}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {isSpeechInputSupported() ? (
                    <button
                      type="button"
                      onClick={() => (mic.listening ? stopMic() : startMic())}
                      aria-pressed={mic.listening}
                      className={`flex h-11 items-center gap-2 rounded-lg px-4 text-body font-semibold ${
                        mic.listening ? 'bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30' : 'bg-white/10 text-slate-100 hover:bg-white/15'
                      }`}
                    >
                      {mic.listening ? <Mic className="h-4 w-4" aria-hidden="true" /> : <MicOff className="h-4 w-4" aria-hidden="true" />}
                      {mic.listening ? 'Mic on' : 'Mic off'}
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 text-small text-slate-400">
                      <Keyboard className="h-4 w-4" aria-hidden="true" /> This browser can’t hear you, so type your answer.
                    </span>
                  )}
                  <Button variant="primary" size="lg" className="h-11 text-body" onClick={() => void submitAnswer()}>
                    <Check className="h-4 w-4" aria-hidden="true" /> Done answering
                  </Button>
                  <button type="button" onClick={skipQuestion} className="flex h-11 items-center gap-1.5 rounded-lg px-3 text-small font-semibold text-slate-400 hover:bg-white/10 hover:text-slate-200">
                    <SkipForward className="h-4 w-4" aria-hidden="true" /> Skip
                  </button>
                  {error && (
                    <button type="button" onClick={continueWithoutFeedback} className="h-11 rounded-lg px-3 text-small font-semibold text-slate-300 underline underline-offset-2">
                      Continue without feedback
                    </button>
                  )}
                </div>
              </div>
            )}

            {phase === 'evaluating' && (
              <div className="mt-4 space-y-2" aria-label="Reviewing your answer">
                <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-full animate-pulse rounded bg-white/10" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
              </div>
            )}

            {phase === 'feedback' && current?.feedback && (
              <div className="mt-4 space-y-4" aria-live="polite">
                <details className="rounded-lg border border-white/10 bg-slate-950/40">
                  <summary className="cursor-pointer px-3 py-2 text-small font-medium text-slate-300">Your answer</summary>
                  <p className="border-t border-white/10 px-3 py-2 text-small text-slate-300">{current.answer}</p>
                </details>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  {RATING_LABELS.map(({ key, label }) => (
                    <div key={key}>
                      <div className="flex justify-between text-label">
                        <span className="text-slate-300">{label}</span>
                        <span className="tabular-nums text-slate-400">{current.feedback?.ratings[key]}/5</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                        <div className="h-full rounded-full bg-indigo-400" style={{ width: `${(current.feedback?.ratings[key] ?? 0) * 20}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                {current.feedback.strengths.length > 0 && (
                  <div>
                    <p className="text-label font-semibold text-emerald-300">What worked</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-small text-slate-200">
                      {current.feedback.strengths.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                )}
                {current.feedback.improvements.length > 0 && (
                  <div>
                    <p className="text-label font-semibold text-amber-300">To improve</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-small text-slate-200">
                      {current.feedback.improvements.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                )}
                {current.feedback.youCouldSay && (
                  <div className="rounded-xl border border-indigo-400/25 bg-indigo-400/10 p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-label font-semibold text-indigo-200">You could say it like this</p>
                      <button
                        type="button"
                        onClick={() => void say(current.feedback?.youCouldSay ?? '')}
                        className="flex items-center gap-1 text-label font-semibold text-indigo-200 hover:underline"
                      >
                        <Volume2 className="h-3.5 w-3.5" aria-hidden="true" /> Hear it
                      </button>
                    </div>
                    <p className="mt-1.5 text-small leading-6 text-slate-100">{current.feedback.youCouldSay}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {phase === 'feedback' && (
            <div className="shrink-0 border-t border-white/10 p-4">
              <Button variant="primary" size="lg" className="w-full" onClick={continueInterview}>
                {current?.feedback?.followUp
                  ? 'Continue: one follow-up question'
                  : plan && asked < plan.questions.length
                    ? 'Next question'
                    : 'Finish interview'}
              </Button>
            </div>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirmEnd}
        title="End the interview now?"
        description={turns.length > 0 ? 'You’ll get a report on the questions answered so far.' : 'You haven’t answered any questions yet, so there will be no report.'}
        confirmLabel="End interview"
        danger
        onCancel={() => setConfirmEnd(false)}
        onConfirm={() => {
          setConfirmEnd(false);
          if (plan && turns.length > 0) finish(plan, turns);
          else {
            flowRef.current += 1;
            stopVoice();
            stopMic();
            onExit();
          }
        }}
      />
    </div>,
    document.body
  );
}

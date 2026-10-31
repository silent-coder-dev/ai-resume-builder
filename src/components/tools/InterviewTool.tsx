'use client';

import { useEffect, useState } from 'react';
import { BriefcaseBusiness, FileText, Maximize, Mic, MicOff, RotateCcw, Settings2, Volume2 } from 'lucide-react';
import { clearSnapshot, enterFullscreen, exitFullscreen, loadSnapshot, loadAttempts, type AttemptSummary } from '@/lib/assessment/session';
import { hasResumeContent } from '@/utils/resumeContent';
import { Button } from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/Field';
import { Alert, Card, PageHeader, Skeleton, formatRelativeTime } from '@/components/ui/Primitives';
import { useToolResume } from '@/components/tools/useToolResume';
import { ResumeSourcePicker, type ResumeSource } from '@/components/tools/ResumeSourcePicker';
import { JobDescriptionField, MIN_JOB_DESCRIPTION_CHARS } from '@/components/tools/JobDescriptionField';
import { INTERVIEW_SNAPSHOT_KEY, InterviewRoom, type InterviewSnapshot } from '@/components/interview/InterviewRoom';
import { InterviewReport } from '@/components/interview/InterviewReport';
import { MIC_PROBLEM_TEXT, isSpeechInputSupported, useInterviewerVoice, useSpeechInput } from '@/components/interview/useSpeech';
import type { InterviewLevel, InterviewResult, InterviewRound, InterviewSetup } from '@/components/interview/types';

const LANGUAGES = [
  { value: 'en-IN', label: 'English (India)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
];

// Tries the real voice and microphone before the interview, so problems show up here.
function DeviceCheck({ lang }: { lang: string }) {
  const [heard, setHeard] = useState('');
  const voice = useInterviewerVoice(lang);
  const mic = useSpeechInput(lang, (text) => setHeard(text));

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg border border-line p-3">
        <p className="text-small font-medium text-ink">Interviewer’s voice</p>
        <Button
          size="sm"
          className="mt-2"
          onClick={() => void voice.speak('Hello, I am Aria. I will be your interviewer today.')}
          loading={voice.speaking}
        >
          {!voice.speaking && <Volume2 className="h-4 w-4" aria-hidden="true" />} Play a test
        </Button>
      </div>
      <div className="rounded-lg border border-line p-3">
        <p className="text-small font-medium text-ink">Your microphone</p>
        {isSpeechInputSupported() ? (
          <>
            <Button
              size="sm"
              variant={mic.listening ? 'subtle' : 'secondary'}
              className="mt-2"
              onClick={() => (mic.listening ? mic.stop() : mic.start())}
              aria-pressed={mic.listening}
            >
              {mic.listening ? <Mic className="h-4 w-4" aria-hidden="true" /> : <MicOff className="h-4 w-4" aria-hidden="true" />}
              {mic.listening ? 'Listening: say something' : 'Test the microphone'}
            </Button>
            {(heard || mic.interim) && <p className="mt-2 text-small text-ink">Heard: “{mic.interim || heard}”</p>}
            {mic.problem && <p className="mt-2 text-small text-error">{MIC_PROBLEM_TEXT[mic.problem]}</p>}
          </>
        ) : (
          <p className="mt-1 text-small text-ink-2">This browser can’t turn speech into text. Use Chrome or Edge to speak, or type your answers.</p>
        )}
      </div>
    </div>
  );
}

function RecentAttempts({ attempts }: { attempts: AttemptSummary[] }) {
  if (attempts.length === 0) return null;
  return (
    <section className="mt-6" aria-labelledby="recent-interviews">
      <h2 id="recent-interviews" className="text-card font-semibold text-ink">Recent interviews</h2>
      <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-surface">
        {attempts.slice(0, 5).map((attempt) => (
          <li key={attempt.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-small">
            <span className="min-w-0 truncate text-ink">{attempt.title}</span>
            <span className="shrink-0 text-ink-2">
              <span className="font-semibold text-ink">{attempt.percent}/100</span> · {formatRelativeTime(attempt.at)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// PRD §18, extended: a spoken, full-screen interview with an AI interviewer,
// built from the candidate's resume and, optionally, the job description.
export function InterviewTool() {
  const { ready, resumes, current, select } = useToolResume();
  const [source, setSource] = useState<ResumeSource>({ kind: 'saved' });
  const [jobDescription, setJobDescription] = useState('');
  const [targetRole, setTargetRole] = useState<string | null>(null);
  const [round, setRound] = useState<InterviewRound>('mixed');
  const [level, setLevel] = useState<InterviewLevel>('standard');
  const [count, setCount] = useState('6');
  const [lang, setLang] = useState('en-IN');
  const [parsing, setParsing] = useState(false);
  const [readingJob, setReadingJob] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [room, setRoom] = useState<{ setup: InterviewSetup; resume: InterviewSnapshot | null; fullscreen: boolean } | null>(null);
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [saved, setSaved] = useState<InterviewSnapshot | null>(null);
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);

  const resumeData = source.kind === 'upload' ? source.data : current?.data ?? null;
  const jdLength = jobDescription.trim().length;
  const hasJob = jdLength > 0;
  const role = targetRole ?? (hasJob ? '' : resumeData?.personalInfo.targetRole ?? '');
  const hasContent = hasResumeContent(resumeData);
  const canStart = hasContent && (!hasJob || jdLength >= MIN_JOB_DESCRIPTION_CHARS) && !parsing && !readingJob;

  useEffect(() => {
    void (async () => {
      const list = await loadAttempts();
      setAttempts(list.filter((attempt) => attempt.kind === 'interview'));
      setSaved(loadSnapshot<InterviewSnapshot>(INTERVIEW_SNAPSHOT_KEY));
    })();
  }, [result]);

  const start = async () => {
    if (!resumeData || !canStart) return;
    // Full screen has to be requested inside this click.
    const fullscreen = await enterFullscreen();
    clearSnapshot(INTERVIEW_SNAPSHOT_KEY);
    setResult(null);
    setRoom({
      fullscreen,
      resume: null,
      setup: { resumeData, jobDescription: jobDescription.trim(), targetRole: role.trim(), round, level, count: Number(count), lang },
    });
  };

  const resumeSaved = async () => {
    if (!saved) return;
    const fullscreen = await enterFullscreen();
    setRoom({ fullscreen, resume: saved, setup: saved.setup });
    setSaved(null);
  };

  const leaveRoom = () => {
    void exitFullscreen();
    clearSnapshot(INTERVIEW_SNAPSHOT_KEY);
    setRoom(null);
    setSaved(null);
  };

  if (result) {
    return (
      <InterviewReport
        result={result}
        onAgain={() => {
          const { setup } = result;
          setResult(null);
          void enterFullscreen().then((fullscreen) => setRoom({ fullscreen, resume: null, setup }));
        }}
        onDone={() => setResult(null)}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        title="AI Interview"
        description="A real interview round, full screen, with an AI interviewer who talks to you. Add your resume and the job. Aria asks one question at a time, you answer out loud, and you get feedback after every answer."
      />

      {!ready ? (
        <Skeleton className="mt-6 h-64" />
      ) : (
        <>
          {saved && (
            <Alert
              tone="info"
              className="mt-6"
              title="You have an interview in progress."
              actions={
                <div className="flex gap-2">
                  <Button size="sm" variant="primary" onClick={() => void resumeSaved()}>Resume</Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      clearSnapshot(INTERVIEW_SNAPSHOT_KEY);
                      setSaved(null);
                    }}
                  >
                    Discard
                  </Button>
                </div>
              }
            >
              {saved.turns.length} question{saved.turns.length === 1 ? '' : 's'} answered so far.
            </Alert>
          )}

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card className="min-w-0 p-5">
              <h2 className="flex items-center gap-2 text-card font-semibold text-ink">
                <FileText className="h-4 w-4 text-primary" aria-hidden="true" /> 1. Your resume
              </h2>
              <div className="mt-4">
                <ResumeSourcePicker
                  name="interview-source"
                  resumes={resumes}
                  currentId={current?.id}
                  source={source}
                  onSelectResume={(id) => {
                    select(id);
                    setTargetRole(null);
                  }}
                  onSourceChange={(next) => {
                    setSource(next);
                    setTargetRole(null);
                  }}
                  onError={setError}
                  onBusyChange={setParsing}
                  uploadHint="Used only for this interview. It is not saved as a resume."
                />
              </div>
              {resumeData && !hasContent && !parsing && (
                <p className="mt-4 text-small text-ink-2">This resume is empty. Add some details first, or upload a PDF.</p>
              )}
            </Card>

            <Card className="min-w-0 p-5">
              <h2 className="flex items-center gap-2 text-card font-semibold text-ink">
                <BriefcaseBusiness className="h-4 w-4 text-primary" aria-hidden="true" /> 2. The job
              </h2>
              <JobDescriptionField
                className="mt-4"
                optional
                rows={6}
                value={jobDescription}
                onChange={setJobDescription}
                onError={setError}
                onBusyChange={setReadingJob}
                hint="Add the job posting and questions will test its requirements. Paste it, or upload a PDF or .txt file."
              />
              <TextField
                className="mt-4"
                label="Target role"
                optional
                value={role}
                onChange={(event) => setTargetRole(event.target.value)}
                placeholder={hasJob ? 'Taken from the job description' : 'e.g. Backend Developer'}
              />
            </Card>
          </div>

          <Card className="mt-4 space-y-5 p-5">
            <h2 className="flex items-center gap-2 text-card font-semibold text-ink">
              <Settings2 className="h-4 w-4 text-primary" aria-hidden="true" /> 3. Interview settings
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SelectField label="Round" value={round} onChange={(event) => setRound(event.target.value as InterviewRound)}>
                <option value="mixed">Mixed (technical + HR)</option>
                <option value="technical">Technical</option>
                <option value="hr">HR &amp; behavioral</option>
              </SelectField>
              <SelectField label="Interviewer style" value={level} onChange={(event) => setLevel(event.target.value as InterviewLevel)}>
                <option value="friendly">Friendly</option>
                <option value="standard">Standard</option>
                <option value="tough">Tough</option>
              </SelectField>
              <SelectField label="Questions" value={count} onChange={(event) => setCount(event.target.value)}>
                {['4', '6', '8', '10'].map((value) => <option key={value} value={value}>{value}</option>)}
              </SelectField>
              <SelectField label="Speech language" value={lang} onChange={(event) => setLang(event.target.value)}>
                {LANGUAGES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </SelectField>
            </div>
            <DeviceCheck lang={lang} />
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" size="lg" onClick={() => void start()} disabled={!canStart}>
                <Maximize className="h-4 w-4" aria-hidden="true" /> Start interview
              </Button>
              <p className="text-small text-ink-2">
                {canStart ? 'Opens full screen. Your camera stays off unless you turn it on, and nothing is recorded.' : hasJob && jdLength < MIN_JOB_DESCRIPTION_CHARS ? 'The job description is too short.' : 'Choose or upload a resume to begin.'}
              </p>
            </div>
          </Card>

          {error && <Alert tone="error" className="mt-4">{error}</Alert>}
          <RecentAttempts attempts={attempts} />
          {attempts.length > 0 && (
            <p className="mt-2 flex items-center gap-1.5 text-label text-ink-2">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Only summaries are kept, on this device. Answers aren’t saved.
            </p>
          )}
        </>
      )}

      {room && (
        <InterviewRoom
          key={room.resume ? 'resumed' : 'new'}
          setup={room.setup}
          resume={room.resume}
          wantsFullscreen={room.fullscreen}
          onExit={leaveRoom}
          onFinish={(finished) => {
            void exitFullscreen();
            clearSnapshot(INTERVIEW_SNAPSHOT_KEY);
            setRoom(null);
            setResult(finished);
          }}
        />
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// The interviewer's voice (speech synthesis) and the candidate's microphone
// (speech recognition). Both are built into the browser. Every path has a fallback
// so a missing voice or microphone never stops the interview: captions are always
// on screen and answers can always be typed.

/* ---------- The interviewer's voice ---------- */

const PREFERRED_VOICES = ['Neerja', 'Heera', 'Aria', 'Jenny', 'Google UK English Female', 'Samantha', 'Zira'];

function pickVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | null {
  const english = voices.filter((voice) => voice.lang.toLowerCase().startsWith('en'));
  for (const name of PREFERRED_VOICES) {
    const match = english.find((voice) => voice.name.includes(name));
    if (match) return match;
  }
  return english.find((voice) => voice.lang === lang) ?? english[0] ?? null;
}

// Long utterances can stall in Chromium, so speak one sentence at a time.
const toSentences = (text: string) => text.match(/[^.!?]+[.!?]*\s*/g)?.map((part) => part.trim()).filter(Boolean) ?? [text];

export function useInterviewerVoice(lang: string) {
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const runRef = useRef(0);
  const finishRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const load = () => {
      voiceRef.current = pickVoice(window.speechSynthesis.getVoices(), lang);
    };
    load();
    window.speechSynthesis.addEventListener?.('voiceschanged', load);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', load);
      window.speechSynthesis.cancel();
    };
  }, [lang]);

  const stop = useCallback(() => {
    runRef.current += 1;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeaking(false);
    finishRef.current?.();
    finishRef.current = null;
  }, []);

  // Resolves when speech ends. When muted or unavailable it waits for a short
  // reading time instead, so the interview keeps the same rhythm.
  const speak = useCallback(
    (text: string) =>
      new Promise<void>((resolve) => {
        stop();
        const run = runRef.current;
        const finish = () => {
          if (finishRef.current !== finish) return;
          finishRef.current = null;
          clearTimeout(safety);
          if (run === runRef.current) setSpeaking(false);
          resolve();
        };
        finishRef.current = finish;
        const words = text.split(/\s+/).length;
        const silent = mutedRef.current || typeof window === 'undefined' || !('speechSynthesis' in window);
        const safety = setTimeout(finish, silent ? Math.min(5000, 800 + words * 180) : 3000 + words * 600);
        setSpeaking(true);
        if (silent) return;

        const sentences = toSentences(text);
        const sayNext = (index: number) => {
          if (run !== runRef.current) return;
          if (index >= sentences.length) {
            finish();
            return;
          }
          const utterance = new SpeechSynthesisUtterance(sentences[index]);
          utterance.lang = voiceRef.current?.lang ?? lang;
          if (voiceRef.current) utterance.voice = voiceRef.current;
          utterance.rate = 1;
          utterance.onend = () => sayNext(index + 1);
          utterance.onerror = () => sayNext(index + 1);
          window.speechSynthesis.speak(utterance);
        };
        sayNext(0);
      }),
    [lang, stop]
  );

  const toggleMuted = useCallback(() => {
    setMuted((previous) => {
      mutedRef.current = !previous;
      return !previous;
    });
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { speak, stop, speaking, muted, toggleMuted };
}

/* ---------- The candidate's microphone ---------- */

interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}

interface RecognitionEvent {
  resultIndex: number;
  results: { length: number; [index: number]: RecognitionResult };
}

interface Recognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type RecognitionConstructor = new () => Recognition;

function recognitionClass(): RecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const scope = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

export const isSpeechInputSupported = () => recognitionClass() !== null;

export type MicProblem = 'denied' | 'service' | 'no-mic' | null;

export function useSpeechInput(lang: string, onText: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [problem, setProblem] = useState<MicProblem>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const wantRef = useRef(false);
  const onTextRef = useRef(onText);

  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  const stop = useCallback(() => {
    wantRef.current = false;
    recognitionRef.current?.stop();
    setListening(false);
    setInterim('');
  }, []);

  const start = useCallback(() => {
    const Recognizer = recognitionClass();
    if (!Recognizer || wantRef.current) return;
    setProblem(null);
    wantRef.current = true;

    const begin = () => {
      const recognition = new Recognizer();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang;
      recognition.onresult = (event) => {
        let pending = '';
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          if (result.isFinal) onTextRef.current(result[0].transcript.trim());
          else pending += result[0].transcript;
        }
        setInterim(pending.trim());
      };
      recognition.onerror = (event) => {
        // "no-speech" and "aborted" are normal pauses; the session restarts below.
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') setProblem('denied');
        else if (event.error === 'network') setProblem('service');
        else if (event.error === 'audio-capture') setProblem('no-mic');
        else return;
        wantRef.current = false;
      };
      // Browsers end recognition after a silence; keep going until the candidate stops.
      recognition.onend = () => {
        if (wantRef.current) {
          try {
            begin();
            return;
          } catch {
            wantRef.current = false;
          }
        }
        setListening(false);
        setInterim('');
      };
      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
    };

    try {
      begin();
    } catch {
      wantRef.current = false;
      setProblem('service');
    }
  }, [lang]);

  useEffect(
    () => () => {
      wantRef.current = false;
      recognitionRef.current?.abort();
    },
    []
  );

  return { start, stop, listening, interim, problem };
}

export const MIC_PROBLEM_TEXT: Record<Exclude<MicProblem, null>, string> = {
  denied: 'The microphone is blocked. Allow it in your browser’s site settings, or type your answer.',
  service: 'Speech recognition isn’t reachable right now. You can type your answer instead.',
  'no-mic': 'No microphone was found. Connect one, or type your answer.',
};

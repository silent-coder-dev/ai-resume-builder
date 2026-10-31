'use client';

import { useEffect, useRef } from 'react';

export type InterviewerState = 'idle' | 'speaking' | 'listening' | 'thinking';

const STATE_LABEL: Record<InterviewerState, string> = {
  idle: 'Waiting',
  speaking: 'Speaking',
  listening: 'Listening to you',
  thinking: 'Thinking',
};

const prefersStillness = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduce-motion'));

// The animated interviewer, drawn entirely in SVG: no images, nothing to download.
// CSS handles breathing, blinking, and glances; the mouth is driven here so it
// moves only while the voice is actually speaking.
export function AiInterviewer({ state, className = '' }: { state: InterviewerState; className?: string }) {
  const mouthRef = useRef<SVGEllipseElement>(null);
  const teethRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const mouth = mouthRef.current;
    const teeth = teethRef.current;
    if (!mouth || !teeth) return;
    if (state !== 'speaking' || prefersStillness()) {
      mouth.setAttribute('ry', '0');
      teeth.style.opacity = '0';
      return;
    }
    let frame = 0;
    const animate = (time: number) => {
      // Two out-of-step waves read as syllables rather than a steady flap.
      const syllable = Math.abs(Math.sin(time / 92)) * (0.45 + 0.55 * Math.abs(Math.sin(time / 311)));
      const open = 1.5 + syllable * 11;
      mouth.setAttribute('ry', open.toFixed(1));
      mouth.setAttribute('rx', (17 - syllable * 3).toFixed(1));
      teeth.style.opacity = open > 4 ? '1' : '0';
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [state]);

  return (
    <figure className={`ai-interviewer ai-state-${state} relative ${className}`} aria-label={`AI interviewer: ${STATE_LABEL[state]}`}>
      <span className="ai-halo" aria-hidden="true" />
      <svg viewBox="0 28 400 432" className="relative h-full w-full" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="ai-skin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f3c9a5" />
            <stop offset="1" stopColor="#e0a981" />
          </linearGradient>
          <linearGradient id="ai-neck" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c98f69" />
            <stop offset="1" stopColor="#dca47d" />
          </linearGradient>
          <linearGradient id="ai-blazer" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2c3a63" />
            <stop offset="1" stopColor="#141c38" />
          </linearGradient>
          <linearGradient id="ai-hair" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#33211b" />
            <stop offset="1" stopColor="#170e0b" />
          </linearGradient>
          <radialGradient id="ai-iris" cx="0.5" cy="0.45" r="0.6">
            <stop offset="0" stopColor="#6d4a2e" />
            <stop offset="1" stopColor="#2c1a0e" />
          </radialGradient>
        </defs>

        <g className="ai-body">
          {/* Shoulders and blazer */}
          <path d="M22 460 C26 378 80 340 150 322 L250 322 C320 340 374 378 378 460 Z" fill="url(#ai-blazer)" />
          {/* Shirt */}
          <path d="M156 322 L200 404 L244 322 L224 306 L176 306 Z" fill="#f4f6fb" />
          <path d="M200 404 L176 330 L190 326 Z M200 404 L224 330 L210 326 Z" fill="#dfe3ee" />
          {/* Neck, with the shadow under the chin */}
          <path d="M170 258 L170 306 C176 336 224 336 230 306 L230 258 Z" fill="url(#ai-neck)" />
          <path d="M170 268 C184 292 216 292 230 268 L230 256 L170 256 Z" fill="#b9805c" opacity="0.55" />
          {/* Lapels */}
          <path d="M150 322 L164 310 L200 404 L172 460 L142 460 L120 382 L146 364 L128 350 Z" fill="#26325a" />
          <path d="M250 322 L236 310 L200 404 L228 460 L258 460 L280 382 L254 364 L272 350 Z" fill="#26325a" />
          <path d="M164 310 L200 404 M236 310 L200 404" stroke="#3a4877" strokeWidth="1.5" fill="none" />
          <path d="M200 404 L172 460 L228 460 Z" fill="#111833" />
        </g>

        <g className="ai-head">
          {/* Hair behind the head */}
          <path d="M108 170 C100 78 158 40 204 40 C262 40 302 84 292 176 C298 226 296 274 274 300 C260 316 240 310 234 288 L166 288 C160 310 140 316 126 300 C104 274 102 226 108 170 Z" fill="url(#ai-hair)" />
          {/* Ears */}
          <ellipse cx="124" cy="182" rx="11" ry="20" fill="#dca47d" />
          <ellipse cx="276" cy="182" rx="11" ry="20" fill="#dca47d" />
          {/* Face */}
          <path d="M126 150 C126 92 162 68 200 68 C238 68 274 92 274 150 C274 206 256 254 226 275 C212 285 188 285 174 275 C144 254 126 206 126 150 Z" fill="url(#ai-skin)" />
          {/* Soft cheeks */}
          <ellipse cx="154" cy="214" rx="17" ry="10" fill="#e78f77" opacity="0.16" />
          <ellipse cx="246" cy="214" rx="17" ry="10" fill="#e78f77" opacity="0.16" />
          {/* Hair framing the face */}
          <path d="M122 158 C118 104 150 58 206 56 C258 56 284 102 278 158 C266 124 244 104 212 96 C186 122 150 128 122 158 Z" fill="url(#ai-hair)" />

          {/* Eyebrows */}
          <g className="ai-brows">
            <path d="M144 156 C154 148 170 147 182 153" stroke="#2a1a14" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M218 153 C230 147 246 148 256 156" stroke="#2a1a14" strokeWidth="5" strokeLinecap="round" fill="none" />
          </g>

          {/* Eyes */}
          <g>
            <ellipse cx="163" cy="176" rx="17" ry="11" fill="#ffffff" />
            <ellipse cx="237" cy="176" rx="17" ry="11" fill="#ffffff" />
            <g className="ai-gaze">
              <circle cx="163" cy="176" r="9" fill="url(#ai-iris)" />
              <circle cx="237" cy="176" r="9" fill="url(#ai-iris)" />
              <circle cx="163" cy="176" r="4.2" fill="#0d0705" />
              <circle cx="237" cy="176" r="4.2" fill="#0d0705" />
              <circle cx="166" cy="173" r="2.2" fill="#ffffff" />
              <circle cx="240" cy="173" r="2.2" fill="#ffffff" />
            </g>
            {/* Upper lash line */}
            <path d="M145 174 C153 163 173 163 181 174" stroke="#1d110c" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <path d="M219 174 C227 163 247 163 255 174" stroke="#1d110c" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            {/* Eyelids close over the eyes when blinking */}
            <ellipse className="ai-lid" cx="163" cy="176" rx="18.5" ry="12.5" fill="#e6b08a" />
            <ellipse className="ai-lid" cx="237" cy="176" rx="18.5" ry="12.5" fill="#e6b08a" />
          </g>

          {/* Nose */}
          <path d="M200 186 L197 208" stroke="#d29a76" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
          <path d="M189 214 C193 221 207 221 211 214" stroke="#bd8360" strokeWidth="2.6" fill="none" strokeLinecap="round" />

          {/* Mouth: a resting smile, and an opening that moves with the voice */}
          <g className="ai-smile">
            <path d="M177 241 C186 235 194 234 200 237 C206 234 214 235 223 241 C212 246 188 246 177 241 Z" fill="#b65a4b" />
            <path d="M177 241 C188 256 212 256 223 241 C212 246 188 246 177 241 Z" fill="#c9705f" />
          </g>
          <ellipse ref={mouthRef} cx="200" cy="243" rx="17" ry="0" fill="#5a1f1c" />
          <path ref={teethRef} d="M186 237 L214 237 L212 241 L188 241 Z" fill="#fbf7f2" style={{ opacity: 0 }} />
        </g>
      </svg>
    </figure>
  );
}

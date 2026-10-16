'use client';

import React, { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, useReducedMotion } from 'framer-motion';

const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;

// Fades and lifts its content into view once, the first time it scrolls on screen.
export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Counts from 0 up to `to` when it first appears. Writes the number straight
// into the DOM so the animation never re-renders React.
export function CountUp({ to, duration = 1.6, suffix = '' }: { to: number; duration?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!inView || !node) return;
    if (reduceMotion) {
      node.textContent = `${to}${suffix}`;
      return;
    }
    const controls = animate(0, to, {
      duration,
      ease: 'easeOut',
      onUpdate: (value) => {
        node.textContent = `${Math.round(value)}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [inView, to, duration, suffix, reduceMotion]);

  return <span ref={ref}>{`0${suffix}`}</span>;
}

// Round progress ring that fills when it scrolls into view.
export function ScoreRing({
  value,
  size = 56,
  stroke = 5,
  trackClassName = 'text-slate-200',
  barClassName = 'text-emerald-500',
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  trackClassName?: string;
  barClassName?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference;

  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className={trackClassName} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          className={barClassName}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">{children}</span>
    </div>
  );
}

// Card with a soft light that follows the cursor.
export function SpotlightCard({
  children,
  className = '',
  glow = 'rgba(99,102,241,0.14)',
}: {
  children: React.ReactNode;
  className?: string;
  glow?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const trackPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    node.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
    node.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
  };

  return (
    <div ref={ref} onPointerMove={trackPointer} className={`group relative overflow-hidden ${className}`}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(420px circle at var(--spot-x, 50%) var(--spot-y, 0%), ${glow}, transparent 65%)`,
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  icon,
  align = 'center',
  tone = 'light',
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  align?: 'center' | 'left';
  tone?: 'light' | 'dark';
}) {
  const dark = tone === 'dark';
  return (
    <Reveal className={align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-2xl'}>
      <span
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] ${
          dark ? 'border border-white/10 bg-white/5 text-indigo-200' : 'border border-indigo-100 bg-white text-indigo-700 shadow-sm'
        }`}
      >
        {icon}
        {eyebrow}
      </span>
      <h2
        className={`mt-5 text-3xl font-black leading-[1.05] tracking-[-0.035em] sm:text-4xl lg:text-5xl ${
          dark ? 'text-white' : 'text-slate-950'
        }`}
      >
        {title}
      </h2>
      {description && (
        <p className={`mt-4 text-sm leading-7 sm:text-base ${dark ? 'text-slate-300' : 'text-slate-600'} ${align === 'center' ? 'mx-auto max-w-2xl' : ''}`}>
          {description}
        </p>
      )}
    </Reveal>
  );
}

// Shows a full A4 resume template scaled down to the width of its container.
// The content is `inert`: it is a picture of a resume, not something to click.
export function ScaledResume({
  children,
  initialScale = 0.5,
  visibleHeight = PAGE_HEIGHT,
  className = '',
}: {
  children: React.ReactNode;
  initialScale?: number;
  visibleHeight?: number;
  className?: string;
}) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(initialScale);

  useEffect(() => {
    if (!node) return;
    const observer = new ResizeObserver(() => setScale(node.clientWidth / PAGE_WIDTH));
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return (
    <div
      ref={setNode}
      className={`relative w-full overflow-hidden bg-white ${className}`}
      style={{ height: Math.round(visibleHeight * scale) }}
    >
      <div
        inert
        className="pointer-events-none absolute left-0 top-0 origin-top-left select-none"
        style={{ width: PAGE_WIDTH, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}

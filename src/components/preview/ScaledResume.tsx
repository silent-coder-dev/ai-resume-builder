'use client';

import React, { useEffect, useState } from 'react';

const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;

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
  // How much of the page (in A4 pixels) to show before cropping.
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

"use client";

import { useRef, type ReactNode } from "react";

/**
 * Horizontal, swipeable card row (native scroll-snap). Shows prev/next arrows on
 * desktop hover; on mobile it's a natural horizontal swipe.
 */
export function ScrollRow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const by = (dir: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <div className={`group relative ${className}`}>
      <div
        ref={ref}
        className="no-scrollbar -mx-1 flex snap-x gap-4 overflow-x-auto scroll-smooth px-1 pb-1"
      >
        {children}
      </div>
      <button
        type="button"
        aria-label="이전"
        onClick={() => by(-1)}
        className="row-arrow left-0 hidden -translate-x-1/2 opacity-0 group-hover:opacity-100 sm:flex"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="다음"
        onClick={() => by(1)}
        className="row-arrow right-0 hidden translate-x-1/2 opacity-0 group-hover:opacity-100 sm:flex"
      >
        ›
      </button>
    </div>
  );
}

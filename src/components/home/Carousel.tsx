"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Auto-advancing, swipeable carousel built on native CSS scroll-snap (so mobile
 * swipe works for free). Auto-slides every `interval` ms, pauses on hover/touch,
 * with prev/next arrows and indicator dots.
 */
export function Carousel({
  children,
  interval = 4000,
  className = "",
}: {
  children: ReactNode;
  interval?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const [active, setActive] = useState(0);
  const slides = Children.toArray(children);
  const n = slides.length;

  const goTo = (idx: number) => {
    const el = ref.current;
    if (!el) return;
    const clamped = ((idx % n) + n) % n;
    el.scrollTo({ left: el.clientWidth * clamped, behavior: "smooth" });
  };

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  useEffect(() => {
    if (n <= 1) return;
    const t = setInterval(() => {
      const el = ref.current;
      if (!el || paused.current) return;
      const cur = Math.round(el.scrollLeft / el.clientWidth);
      el.scrollTo({ left: el.clientWidth * ((cur + 1) % n), behavior: "smooth" });
    }, interval);
    return () => clearInterval(t);
  }, [n, interval]);

  return (
    <div
      className={`group relative ${className}`}
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      onTouchStart={() => (paused.current = true)}
      onTouchEnd={() => (paused.current = false)}
    >
      <div
        ref={ref}
        onScroll={onScroll}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-2xl"
      >
        {slides.map((s, i) => (
          <div key={i} className="w-full shrink-0 snap-center">
            {s}
          </div>
        ))}
      </div>

      {n > 1 && (
        <>
          <button
            type="button"
            aria-label="이전"
            onClick={() => goTo(active - 1)}
            className="carousel-arrow left-3 opacity-0 group-hover:opacity-100"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="다음"
            onClick={() => goTo(active + 1)}
            className="carousel-arrow right-3 opacity-0 group-hover:opacity-100"
          >
            ›
          </button>
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {slides.map((_, d) => (
              <button
                key={d}
                type="button"
                aria-label={`${d + 1}번째 슬라이드`}
                onClick={() => goTo(d)}
                className={`pointer-events-auto h-2 rounded-full transition-all duration-250 ${
                  active === d ? "w-6 bg-sepia" : "w-2 bg-paper/70 hover:bg-paper"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

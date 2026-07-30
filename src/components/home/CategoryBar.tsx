"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { categories } from "@/config/categories";

/**
 * Horizontal, swipeable category pill bar under the header. Shows a soft fade +
 * arrow at whichever edge has more content, hinting "there's more to the side".
 */
export function CategoryBar({ active }: { active?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = () => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    update();
    const onResize = () => update();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const by = (dir: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={ref}
        onScroll={update}
        className="no-scrollbar flex gap-2 overflow-x-auto py-1"
        aria-label="주제별 카테고리"
      >
        {categories.map((c) => {
          const isActive = active === c.slug;
          return (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 font-sans text-sm font-medium transition duration-250 ${
                isActive
                  ? "border-brand bg-brand text-paper"
                  : "border-line bg-brand-tint text-brand hover:border-brand-soft hover:bg-brand hover:text-paper"
              }`}
            >
              {c.label}
            </Link>
          );
        })}
      </div>

      {canLeft && (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-paper to-transparent" />
          <button
            type="button"
            aria-label="이전 카테고리"
            onClick={() => by(-1)}
            className="cat-arrow left-0"
          >
            ‹
          </button>
        </>
      )}
      {canRight && (
        <>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-paper to-transparent" />
          <button
            type="button"
            aria-label="다음 카테고리"
            onClick={() => by(1)}
            className="cat-arrow right-0"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}

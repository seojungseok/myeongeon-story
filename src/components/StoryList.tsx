"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { categoryLabel } from "@/config/categories";
import type { StoryListItem } from "@/lib/story-list";
import { StoryImage } from "./StoryImage";

/**
 * Compact, title-first list used on category / tag / search / hub pages, with
 * real page-by-page navigation instead of endless scrolling.
 *
 * Why: on a phone, a wall of stories means scrolling forever to reach the last
 * one. Here each "page" shows a small, fixed number of stories (4 on mobile, 12
 * on desktop) and you flip pages — so any story is a couple of taps away.
 *
 * SEO: every row is rendered into the HTML (rows outside the current page are
 * only visually hidden via CSS), so crawlers still see every internal link.
 */

export function StoryRow({ story }: { story: StoryListItem }) {
  return (
    <Link
      href={`/story/${story.id}`}
      className="group flex items-center gap-4 px-4 py-4 transition hover:bg-brand-tint/50 sm:px-5"
    >
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-brand-tint sm:h-[4.5rem] sm:w-[4.5rem]">
        <StoryImage
          story={{
            image: story.image,
            title: story.title,
            photoKeyword: story.photoKeyword ?? "",
          }}
          sizes="80px"
          className="transition duration-500 group-hover:scale-105"
        />
        <span className="absolute left-1 top-1 rounded-full bg-brand/70 px-1.5 py-0.5 font-sans text-[0.65rem] font-medium text-paper backdrop-blur-sm sm:hidden">
          {categoryLabel(story.category)}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 font-serif text-lg font-bold leading-snug text-ink group-hover:text-brand sm:text-xl">
          {story.title}
        </h3>
        <p className="mt-1 line-clamp-1 font-serif text-sm italic text-subtle">
          &ldquo;{story.quote}&rdquo;
        </p>
        <div className="mt-1.5 hidden items-center gap-2 font-sans text-xs text-subtle sm:flex">
          <span className="rounded-full bg-brand-tint px-2 py-0.5 text-brand">
            {categoryLabel(story.category)}
          </span>
          <span>{story.createdAt}</span>
        </div>
      </div>

      <span
        aria-hidden
        className="flex-shrink-0 font-sans text-2xl leading-none text-line transition group-hover:text-brand"
      >
        ›
      </span>
    </Link>
  );
}

/** Responsive page size: `mobile` under 640px, `desktop` at/above. */
function usePageSize(mobile: number, desktop: number): number {
  const [size, setSize] = useState(desktop); // SSR + first paint = desktop (no mismatch)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const apply = () => setSize(mq.matches ? mobile : desktop);
    apply();
    mq.addEventListener("change", apply);
    window.addEventListener("resize", apply); // fallback for envs that skip mq change
    return () => {
      mq.removeEventListener("change", apply);
      window.removeEventListener("resize", apply);
    };
  }, [mobile, desktop]);
  return size;
}

/** [1, "…", 4, 5, 6, "…", 12] — always shows first, last, and current ±1. */
function pageWindow(page: number, total: number): (number | "…")[] {
  const keep = new Set<number>([1, total, page - 1, page, page + 1]);
  const nums = [...keep].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const n of nums) {
    if (n - prev > 1) out.push("…");
    out.push(n);
    prev = n;
  }
  return out;
}

export function StoryList({
  stories,
  mobilePageSize = 4,
  desktopPageSize = 12,
  emptyText = "아직 이야기가 없습니다. 곧 채워집니다.",
}: {
  stories: StoryListItem[];
  mobilePageSize?: number;
  desktopPageSize?: number;
  emptyText?: string;
}) {
  const pageSize = usePageSize(mobilePageSize, desktopPageSize);
  const [page, setPage] = useState(1);
  const topRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.max(1, Math.ceil(stories.length / pageSize));

  // Keep the current page valid if the page size (breakpoint) changes.
  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  if (stories.length === 0) {
    return (
      <p className="rounded-2xl border border-line bg-white/60 px-5 py-10 text-center text-subtle">
        {emptyText}
      </p>
    );
  }

  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  const goto = (p: number) => {
    const next = Math.min(Math.max(1, p), totalPages);
    setPage(next);
    // Jump back to the top of the list so the new page starts in view.
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      <div ref={topRef} className="scroll-mt-24" />
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white/60">
        {stories.map((s, i) => (
          <li key={s.id} className={i >= start && i < end ? "" : "hidden"}>
            <StoryRow story={s} />
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <nav
          className="mt-6 flex items-center justify-center gap-1.5 font-sans text-sm"
          aria-label="페이지 이동"
        >
          <button
            type="button"
            onClick={() => goto(page - 1)}
            disabled={page === 1}
            className="rounded-full border border-line bg-white px-3 py-2 text-ink transition hover:border-brand-soft hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="이전 페이지"
          >
            ‹ 이전
          </button>

          {pageWindow(page, totalPages).map((n, i) =>
            n === "…" ? (
              <span key={`gap-${i}`} className="px-1 text-subtle">
                …
              </span>
            ) : (
              <button
                key={n}
                type="button"
                onClick={() => goto(n)}
                aria-current={n === page ? "page" : undefined}
                className={`h-9 min-w-9 rounded-full border px-3 transition ${
                  n === page
                    ? "border-brand bg-brand font-semibold text-paper"
                    : "border-line bg-white text-ink hover:border-brand-soft hover:text-brand"
                }`}
              >
                {n}
              </button>
            ),
          )}

          <button
            type="button"
            onClick={() => goto(page + 1)}
            disabled={page === totalPages}
            className="rounded-full border border-line bg-white px-3 py-2 text-ink transition hover:border-brand-soft hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="다음 페이지"
          >
            다음 ›
          </button>
        </nav>
      )}
    </div>
  );
}

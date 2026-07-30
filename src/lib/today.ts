import { getAllStories } from "./content";
import type { Story } from "./types";

/**
 * Date-based "today" selections. These pick deterministically from the day's
 * date so the homepage changes daily WITHOUT any DB, runtime randomness, or
 * per-request work — the page can be statically generated and revalidated
 * once per day.
 */

/** Days since epoch in local time — our daily seed. */
function daySeed(date = new Date()): number {
  const utc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor(utc / 86_400_000);
}

/** A tiny deterministic PRNG (mulberry32) seeded by an integer. */
function seededPick<T>(arr: T[], seed: number): T | undefined {
  if (arr.length === 0) return undefined;
  let t = (seed + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return arr[Math.floor(r * arr.length)];
}

export type TodayPicks = {
  featured?: Story; // 오늘의 추천 이야기
  mostRead?: Story; // 오늘 가장 많이 읽은 이야기 (viewWeight)
  quote?: Story; // 오늘의 명언 (we surface a story's quote)
  random?: Story; // 랜덤 이야기
};

export function getTodayPicks(seed = daySeed()): TodayPicks {
  const all = getAllStories();
  if (all.length === 0) return {};

  const featured = seededPick(all, seed);

  const mostRead = [...all].sort((a, b) => b.viewWeight - a.viewWeight)[0];

  // Different offsets so the four cards don't all land on the same story.
  const quote = seededPick(all, seed * 7 + 13);

  let random = seededPick(all, seed * 31 + 101);
  // Best-effort: avoid random === featured when we have options.
  if (all.length > 1 && random?.id === featured?.id) {
    random = seededPick(
      all.filter((s) => s.id !== featured?.id),
      seed * 31 + 102,
    );
  }

  return { featured, mostRead, quote, random };
}

/** A stable "random story" id for a given seed — used by list pages too. */
export function getRandomStoryId(seed = Date.now()): string | undefined {
  return seededPick(getAllStories(), seed)?.id;
}

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

/** Small stable hash of a string (FNV-1a) → fixed order per story id. */
function idHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * "오늘의 명언" — a deterministic DAILY ROTATION through the whole catalog.
 *
 * Better than a seeded random pick: random collisions make some quotes reappear
 * at uneven, short intervals while others rarely show. Rotation steps one story
 * per day through a stable order, so every quote gets its turn, the same one
 * never lands two days running, and the catalog is covered evenly. It stays
 * deterministic (no DB, no per-request work) so the page is still SSG + daily
 * revalidate. `exclude` lets the homepage skip any story already shown in the
 * 추천/최신글 sections that day, so nothing appears twice on one screen.
 */
export function getTodayQuote(
  exclude: Iterable<string | undefined> = [],
  seed = daySeed(),
): Story | undefined {
  const all = getAllStories();
  if (all.length === 0) return undefined;

  // Stable order that barely shifts when new stories are added (sort by a hash
  // of the id, not by date/position), so the daily rotation stays smooth.
  const ordered = [...all].sort(
    (a, b) => idHash(a.id) - idHash(b.id) || a.id.localeCompare(b.id),
  );
  const n = ordered.length;
  const start = ((seed % n) + n) % n; // step once per day

  const ex = new Set<string>();
  for (const id of exclude) if (id) ex.add(id);

  // Walk forward from today's slot, skipping anything already shown elsewhere.
  for (let i = 0; i < n; i++) {
    const cand = ordered[(start + i) % n];
    if (!ex.has(cand.id)) return cand;
  }
  return ordered[start]; // everything excluded (tiny catalog) — show today's slot
}

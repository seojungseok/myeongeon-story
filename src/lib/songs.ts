/**
 * Song resolver — links a story to a THEME-matching K.HYUN song.
 *
 * Songs live in data/youtube-songs.json (from `npm run fetch:youtube`), where
 * each song carries one or more theme tags (부모 / 부부 / 이별 / 사랑 / …).
 *
 * Matching rules (see also the story's category + tags):
 *   1. Explicit story.youtubeId always wins (manual override).
 *   2. Otherwise match on THEME overlap: a 어머니 story pulls only 부모 songs, a
 *      이별 story only 이별 songs. Never a mother story with a breakup song.
 *   3. If no theme match, fall back to the broad CATEGORY (가족/인연/그리움/…).
 *   4. If still nothing, attach the DEFAULT song ("당신이 있어서") — every story
 *      always gets a song. Change DEFAULT_SONG_TITLE below to swap it.
 *
 * Re-running `npm run fetch:youtube` refreshes the pool and every story
 * re-matches automatically on the next build. No per-story editing.
 *
 * Server-only (reads fs).
 */
import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Story } from "./types";

type Song = { youtubeId: string; title?: string; themes?: string[]; category?: string };
type SongsFile = { videos?: Song[] };

const SONGS_FILE = path.join(process.cwd(), "data", "youtube-songs.json");

/**
 * Universal fallback: when a story matches no theme and no category, it still
 * gets this song. Matched by title substring so it survives id changes; if not
 * found, falls back to the newest song, then to the pinned id.
 */
const DEFAULT_SONG_TITLE = "당신이란사람"; // K.HYUN "…#당신이란사람 #감성발라드"
const DEFAULT_SONG_ID = "eOso7tUWwB0"; // "K.hyun - 당신이란사람 (Official MV)"

/** Story CATEGORY → song themes it should draw from. */
const CATEGORY_THEMES: Record<string, string[]> = {
  family: ["부모"],
  relationship: ["부부", "인연"],
  longing: ["이별", "고향"],
  love: ["사랑"],
  friend: ["친구"],
  hope: ["희망"],
  courage: ["희망"],
  challenge: ["희망"],
  life: ["인생"],
  time: ["인생"],
  // comfort / success / effort / study / happiness: no dedicated song theme →
  // fall back to broad category (usually empty ⇒ no song, which is fine).
};

/**
 * Story TAG (Korean) → song theme. Lets tags refine the match beyond category.
 * Note: only explicit parent words (어머니/아버지/…) map to 부모 — a generic
 * "가족" tag is intentionally NOT mapped, so a non-parent story doesn't get
 * pulled to a parent song.
 */
const TAG_THEMES: Record<string, string> = {
  어머니: "부모", 어머님: "부모", 엄마: "부모", 아버지: "부모", 아버님: "부모",
  아빠: "부모", 부모: "부모", 부모님: "부모", 효: "부모",
  부부: "부부", 아내: "부부", 남편: "부부", 여보: "부부", 반려: "부부",
  인연: "인연", 운명: "인연", 만남: "인연",
  이별: "이별", 그리움: "이별", 그리운: "이별", 눈물: "이별", 추억: "이별",
  고향: "고향",
  사랑: "사랑", 첫사랑: "사랑", 연인: "사랑",
  희망: "희망", 용기: "희망", 도전: "희망",
  인생: "인생", 세월: "인생", 시간: "인생", 청춘: "인생",
  친구: "친구", 우정: "친구",
};

/**
 * When a story wants several themes, match the most identity-defining one first:
 * a story tagged 어머니 should get a 부모 song even if it's also a 그리움 story.
 */
const THEME_PRIORITY = ["부모", "부부", "인연", "고향", "이별", "사랑", "친구", "희망", "인생"];

/** Story CATEGORY → broad bucket (matches a song's primary category). */
const CATEGORY_BUCKET: Record<string, string> = {
  family: "family", relationship: "relationship", longing: "longing",
  love: "love", friend: "friend", hope: "hope", courage: "hope",
  challenge: "hope", life: "life", time: "life",
};

let _cache: Song[] | null = null;
function loadSongs(): Song[] {
  if (_cache) return _cache;
  try {
    if (fs.existsSync(SONGS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(SONGS_FILE, "utf8")) as SongsFile;
      _cache = Array.isArray(parsed.videos) ? parsed.videos : [];
    } else {
      _cache = [];
    }
  } catch {
    _cache = [];
  }
  return _cache;
}

/** Small deterministic string hash → stable song pick per story. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick(pool: Song[], seed: string): string {
  if (pool.length === 0) return "";
  return pool[hash(seed) % pool.length]?.youtubeId ?? "";
}

/** Themes a story wants a song for, from its category + tags. */
function storyThemes(story: Pick<Story, "category" | "tags">): Set<string> {
  const themes = new Set<string>(CATEGORY_THEMES[story.category] ?? []);
  for (const tag of story.tags) {
    const th = TAG_THEMES[tag.trim()];
    if (th) themes.add(th);
  }
  return themes;
}

/**
 * Resolve the YouTube video id to embed on a story page.
 * Returns "" when nothing matches by theme or broad category.
 */
export function getSongForStory(story: Pick<Story, "id" | "category" | "tags" | "youtubeId">): string {
  if (story.youtubeId) return story.youtubeId; // explicit override wins

  const songs = loadSongs();
  const wanted = storyThemes(story);

  // 1) Precise: match the story's most identity-defining theme first (a 어머니
  //    story gets a 부모 song even though it's also a 그리움 story).
  if (wanted.size > 0) {
    for (const theme of THEME_PRIORITY) {
      if (!wanted.has(theme)) continue;
      const pool = songs.filter((s) => (s.themes ?? []).includes(theme));
      if (pool.length > 0) return pick(pool, story.id);
    }
  }

  // 2) Coarse: songs whose primary category matches the story's broad bucket.
  const bucket = CATEGORY_BUCKET[story.category];
  if (bucket) {
    const byCat = songs.filter((s) => s.category === bucket);
    if (byCat.length > 0) return pick(byCat, story.id);
  }

  // 3) Nothing fitting — fall back to the universal default song.
  return defaultSong(songs);
}

/** The default fallback song id: prefer the pinned id, then any titled match, then newest. */
function defaultSong(songs: Song[]): string {
  if (songs.some((s) => s.youtubeId === DEFAULT_SONG_ID)) return DEFAULT_SONG_ID;
  const byTitle = songs.find((s) => (s.title ?? "").includes(DEFAULT_SONG_TITLE));
  if (byTitle?.youtubeId) return byTitle.youtubeId;
  return songs[0]?.youtubeId ?? DEFAULT_SONG_ID;
}

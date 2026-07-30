/**
 * Song resolver — links a story to a category-matching K.HYUN song.
 *
 * Songs live in data/youtube-songs.json (produced by `npm run fetch:youtube`).
 * Instead of baking a fixed youtubeId into every story file, the site resolves
 * the song at build time from that file. So when new songs are uploaded, you
 * only re-run `npm run fetch:youtube` and rebuild — every story auto-updates to
 * the freshest matching song. No manual editing per story.
 *
 * Resolution order for a story:
 *   1. If the story sets an explicit `youtubeId`, that always wins (manual override).
 *   2. Otherwise pick deterministically from the story's category pool.
 *   3. If that category has no songs, walk a fallback chain of related
 *      categories so the story still gets an emotionally-matched song.
 *
 * Server-only (reads fs) — import from Server Components / build code.
 */
import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Story } from "./types";

type Song = { youtubeId: string; title?: string; publishedAt?: string };
type SongsFile = { byCategory?: Record<string, Song[]> };

const SONGS_FILE = path.join(process.cwd(), "data", "youtube-songs.json");

/**
 * Per-category fallback chain. When a story's own category has no song, we try
 * the next-closest categories (by emotional theme) so the pairing still feels
 * right — a "용기" story leans on 도전/노력/희망, a "그리움" story on 사랑/가족, etc.
 * Every chain ends in the broad, always-populated pools (love/family/longing/time).
 */
const FALLBACK_CHAIN: Record<string, string[]> = {
  life: ["life", "time", "hope", "comfort", "love"],
  comfort: ["comfort", "longing", "family", "love", "life"],
  courage: ["courage", "challenge", "effort", "hope", "life", "love"],
  relationship: ["relationship", "love", "family", "friend", "longing"],
  longing: ["longing", "love", "family", "comfort"],
  success: ["success", "effort", "challenge", "life", "hope"],
  effort: ["effort", "success", "challenge", "life", "hope"],
  love: ["love", "relationship", "longing", "family"],
  friend: ["friend", "relationship", "love", "life"],
  happiness: ["happiness", "love", "family", "life", "hope"],
  challenge: ["challenge", "courage", "effort", "hope", "life"],
  study: ["study", "effort", "life", "hope"],
  time: ["time", "life", "longing", "comfort"],
  family: ["family", "love", "longing", "comfort"],
  hope: ["hope", "life", "courage", "love"],
};

let _cache: Record<string, Song[]> | null = null;

function loadSongs(): Record<string, Song[]> {
  if (_cache) return _cache;
  try {
    if (fs.existsSync(SONGS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(SONGS_FILE, "utf8")) as SongsFile;
      _cache = parsed.byCategory ?? {};
    } else {
      _cache = {};
    }
  } catch {
    _cache = {};
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

/**
 * Resolve the YouTube video id to embed on a story page.
 * Returns "" when nothing matches (the page then shows no player).
 */
export function getSongForStory(story: Pick<Story, "id" | "category" | "youtubeId">): string {
  if (story.youtubeId) return story.youtubeId; // explicit override wins
  const byCat = loadSongs();
  const chain = FALLBACK_CHAIN[story.category] ?? [story.category];
  // Broad tail so a story always lands on *some* fitting mid-life ballad even if
  // its own theme has no songs yet. Themed categories are tried first, above.
  const GLOBAL_TAIL = ["love", "longing", "family", "time", "life"];
  for (const cat of [...chain, ...GLOBAL_TAIL]) {
    const pool = byCat[cat];
    if (pool && pool.length > 0) {
      const idx = hash(story.id) % pool.length;
      return pool[idx]?.youtubeId ?? "";
    }
  }
  return "";
}

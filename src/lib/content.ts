/**
 * Content loader — the single abstraction over all story sources.
 *
 * Reads every `.json`, `.md`, and `.mdx` file in src/content/stories/,
 * normalizes each into the `Story` type, validates required fields, and
 * caches the result for the lifetime of the build/request.
 *
 * Add a story by dropping a file into src/content/stories/. No code changes.
 *
 * This module is server-only (uses fs) — import it from Server Components,
 * generateStaticParams, route handlers, sitemap, etc.
 */
import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { categorySlug } from "@/config/categories";
import type { RelatedQuote, Story } from "./types";

const STORIES_DIR = path.join(process.cwd(), "src", "content", "stories");

// ---- helpers ---------------------------------------------------------------

function toArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === "string")
    return v
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  return [];
}

function normalizeRelatedQuotes(v: unknown): RelatedQuote[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((q): RelatedQuote | null => {
      if (typeof q === "string") return { text: q, author: "작자 미상" };
      if (q && typeof q === "object") {
        const o = q as Record<string, unknown>;
        const text = String(o.text ?? o.quote ?? "").trim();
        if (!text) return null;
        return {
          text,
          author: String(o.author ?? o.quoteAuthor ?? "작자 미상").trim(),
          storyId: o.storyId ? String(o.storyId) : undefined,
        };
      }
      return null;
    })
    .filter((x): x is RelatedQuote => x !== null)
    .slice(0, 5);
}

function autoDescription(story: string, fallback: string): string {
  const flat = (story || "").replace(/\s+/g, " ").trim();
  if (!flat) return fallback;
  return flat.length > 155 ? `${flat.slice(0, 152)}…` : flat;
}

/**
 * Image filename base — keyed by the story ID (not the keyword) so two stories
 * that happen to share a photoKeyword never map to the same cached file.
 */
export function imageSlug(story: Pick<Story, "id" | "photoKeyword">): string {
  const base = (story.id || story.photoKeyword || "story")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "story";
}

function normalize(
  raw: Record<string, unknown>,
  fallbackId: string,
  source: "json" | "markdown",
  bodyOverride?: string,
): Story | null {
  const id = String(raw.id ?? fallbackId).trim();
  const title = String(raw.title ?? "").trim();
  const quote = String(raw.quote ?? "").trim();
  const story = String(bodyOverride ?? raw.story ?? "").trim();

  // Required fields. Skip (with a warning) rather than crash the build.
  if (!id || !title || !quote || !story) {
    console.warn(
      `[content] Skipping "${fallbackId}" — missing required field (id/title/quote/story).`,
    );
    return null;
  }

  const normalized: Story = {
    id,
    category: categorySlug(String(raw.category ?? "life")),
    tags: toArray(raw.tags),
    title,
    quote,
    quoteAuthor: String(raw.quoteAuthor ?? "작자 미상").trim() || "작자 미상",
    story,
    lesson: String(raw.lesson ?? "").trim(),
    todayAction: String(raw.todayAction ?? "").trim(),
    relatedQuotes: normalizeRelatedQuotes(raw.relatedQuotes),
    photoKeyword: String(raw.photoKeyword ?? "").trim(),
    viewWeight: Number(raw.viewWeight ?? 0) || 0,
    coupangUrl: String(raw.coupangUrl ?? "").trim(),
    createdAt: String(raw.createdAt ?? "").trim() || "1970-01-01",
    youtubeId: String(raw.youtubeId ?? "").trim() || undefined,
    description:
      String(raw.description ?? "").trim() || autoDescription(story, title),
    _source: source,
  };

  normalized.image = `/images/pexels/${imageSlug(normalized)}.jpg`;
  const bodyImageFile = path.join(
    process.cwd(),
    "public",
    "images",
    "pexels",
    `${imageSlug(normalized)}-detail.jpg`,
  );
  if (fs.existsSync(bodyImageFile)) {
    normalized.bodyImage = `/images/pexels/${imageSlug(normalized)}-detail.jpg`;
  }
  return normalized;
}

// ---- loading (cached) ------------------------------------------------------

let _cache: Story[] | null = null;

function loadAll(): Story[] {
  if (_cache) return _cache;

  if (!fs.existsSync(STORIES_DIR)) {
    _cache = [];
    return _cache;
  }

  const files = fs
    .readdirSync(STORIES_DIR)
    .filter((f) => /\.(json|md|mdx)$/i.test(f));

  const stories: Story[] = [];

  for (const file of files) {
    const full = path.join(STORIES_DIR, file);
    const rawText = fs.readFileSync(full, "utf8");
    const base = file.replace(/\.(json|md|mdx)$/i, "");

    try {
      if (/\.json$/i.test(file)) {
        const parsed = JSON.parse(rawText);
        // A JSON file may hold one story or an array of stories.
        const items = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of items) {
          const s = normalize(item, base, "json");
          if (s) stories.push(s);
        }
      } else {
        // Markdown / MDX: frontmatter = fields, body = story text.
        const { data, content } = matter(rawText);
        const s = normalize(
          data as Record<string, unknown>,
          base,
          "markdown",
          content.trim(),
        );
        if (s) stories.push(s);
      }
    } catch (err) {
      console.warn(`[content] Failed to parse ${file}:`, (err as Error).message);
    }
  }

  // Detect duplicate ids early — they would collide on /story/[id].
  const seen = new Set<string>();
  for (const s of stories) {
    if (seen.has(s.id)) {
      console.warn(`[content] Duplicate story id "${s.id}" — later ones win.`);
    }
    seen.add(s.id);
  }

  // De-dupe by id (last wins), then sort newest first.
  const byId = new Map(stories.map((s) => [s.id, s]));
  _cache = [...byId.values()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  return _cache;
}

// ---- public API ------------------------------------------------------------

export function getAllStories(): Story[] {
  return loadAll();
}

export function getStory(id: string): Story | undefined {
  return loadAll().find((s) => s.id === id);
}

export function getStoriesByCategory(categoryKey: string): Story[] {
  const slug = categorySlug(categoryKey);
  return loadAll().filter((s) => s.category === slug);
}

export function getStoriesByTag(tag: string): Story[] {
  const t = tag.toLowerCase();
  return loadAll().filter((s) => s.tags.some((x) => x.toLowerCase() === t));
}

/** Stories matching a situational hub: any of its categories OR any of its tags. */
export function getStoriesForCollection(c: {
  categories?: string[];
  tags?: string[];
}): Story[] {
  const cats = new Set(c.categories ?? []);
  const tags = new Set((c.tags ?? []).map((t) => t.toLowerCase()));
  if (cats.size === 0 && tags.size === 0) return [];
  return loadAll().filter(
    (s) => cats.has(s.category) || s.tags.some((t) => tags.has(t.toLowerCase())),
  );
}

export function getAllTags(): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const s of loadAll())
    for (const tag of s.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export function getPopularStories(limit = 6): Story[] {
  return [...loadAll()]
    .sort((a, b) => b.viewWeight - a.viewWeight)
    .slice(0, limit);
}

export function getRecentStories(limit = 12): Story[] {
  return loadAll().slice(0, limit);
}

/** Prev/next in the full (newest-first) ordering, for detail-page navigation. */
export function getPrevNext(id: string): { prev?: Story; next?: Story } {
  const all = loadAll();
  const i = all.findIndex((s) => s.id === id);
  if (i === -1) return {};
  // "prev" = older (further down the list), "next" = newer (up the list).
  return { next: all[i - 1], prev: all[i + 1] };
}

/** Full-text-ish search over title, quote, author and tags. */
export function searchStories(query: string): Story[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return loadAll().filter((s) => {
    const hay = [s.title, s.quote, s.quoteAuthor, ...s.tags]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

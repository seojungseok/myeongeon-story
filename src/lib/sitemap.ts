import { site } from "@/config/site";
import { getAllStories, getAllTags } from "./content";
import { categories } from "@/config/categories";
import { collections } from "@/config/collections";

/** Max URLs per story sitemap chunk (well under the 50k limit). */
export const STORY_CHUNK_SIZE = 2000;

export type UrlEntry = {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
};

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    c === "<"
      ? "&lt;"
      : c === ">"
        ? "&gt;"
        : c === "&"
          ? "&amp;"
          : c === "'"
            ? "&apos;"
            : "&quot;",
  );
}

export function urlsetXml(entries: UrlEntry[]): string {
  const body = entries
    .map((e) => {
      const parts = [`<loc>${escapeXml(e.loc)}</loc>`];
      if (e.lastmod) parts.push(`<lastmod>${e.lastmod}</lastmod>`);
      if (e.changefreq) parts.push(`<changefreq>${e.changefreq}</changefreq>`);
      if (e.priority != null)
        parts.push(`<priority>${e.priority.toFixed(1)}</priority>`);
      return `<url>${parts.join("")}</url>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

export function sitemapIndexXml(locs: { loc: string; lastmod?: string }[]): string {
  const body = locs
    .map(
      (l) =>
        `<sitemap><loc>${escapeXml(l.loc)}</loc>${
          l.lastmod ? `<lastmod>${l.lastmod}</lastmod>` : ""
        }</sitemap>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`;
}

const today = () => new Date().toISOString().slice(0, 10);

export function storyChunkCount(): number {
  const n = getAllStories().length;
  return Math.max(1, Math.ceil(n / STORY_CHUNK_SIZE));
}

export function storyChunkEntries(chunk: number): UrlEntry[] {
  const all = getAllStories();
  const start = chunk * STORY_CHUNK_SIZE;
  return all.slice(start, start + STORY_CHUNK_SIZE).map((s) => ({
    loc: `${site.url}/story/${s.id}`,
    lastmod: s.createdAt,
    changefreq: "monthly",
    priority: 0.8,
  }));
}

export function categoryEntries(): UrlEntry[] {
  return categories.map((c) => ({
    loc: `${site.url}/category/${c.slug}`,
    lastmod: today(),
    changefreq: "weekly",
    priority: 0.6,
  }));
}

export function tagEntries(): UrlEntry[] {
  return getAllTags().map(({ tag }) => ({
    loc: `${site.url}/tag/${encodeURIComponent(tag)}`,
    lastmod: today(),
    changefreq: "weekly",
    priority: 0.5,
  }));
}

export function staticEntries(): UrlEntry[] {
  return [
    { loc: `${site.url}/`, lastmod: today(), changefreq: "daily", priority: 1.0 },
    { loc: `${site.url}/stories`, lastmod: today(), changefreq: "daily", priority: 0.7 },
    // Situational hub pages — high-value long-tail landing pages.
    ...collections.map((c) => ({
      loc: `${site.url}/read/${c.slug}`,
      lastmod: today(),
      changefreq: "weekly",
      priority: 0.7,
    })),
    { loc: `${site.url}/search`, changefreq: "monthly", priority: 0.3 },
  ];
}

/** All sub-sitemap URLs, for the sitemap index. */
export function subSitemaps(): { loc: string; lastmod?: string }[] {
  const list: { loc: string; lastmod?: string }[] = [
    { loc: `${site.url}/sitemaps/static.xml`, lastmod: today() },
    { loc: `${site.url}/sitemaps/category.xml`, lastmod: today() },
    { loc: `${site.url}/sitemaps/tag.xml`, lastmod: today() },
  ];
  for (let i = 0; i < storyChunkCount(); i++) {
    list.push({ loc: `${site.url}/sitemaps/story/${i}`, lastmod: today() });
  }
  return list;
}

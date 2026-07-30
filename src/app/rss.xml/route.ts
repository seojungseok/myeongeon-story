import { site } from "@/config/site";
import { getRecentStories } from "@/lib/content";

export const dynamic = "force-static";

function esc(s: string): string {
  return s.replace(/[<>&]/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&amp;",
  );
}

export function GET() {
  const stories = getRecentStories(50);
  const items = stories
    .map((s) => {
      const url = `${site.url}/story/${s.id}`;
      return `<item>
  <title>${esc(s.title)}</title>
  <link>${url}</link>
  <guid isPermaLink="true">${url}</guid>
  <pubDate>${new Date(s.createdAt).toUTCString()}</pubDate>
  <description>${esc(s.description || s.quote)}</description>
</item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>${esc(site.name)}</title>
  <link>${site.url}</link>
  <description>${esc(site.description)}</description>
  <language>ko</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  ${items}
</channel></rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}

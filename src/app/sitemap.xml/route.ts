import { sitemapIndexXml, subSitemaps } from "@/lib/sitemap";

// Static sitemap INDEX. It points at the split sub-sitemaps
// (static / category / tag / story-chunks), which auto-grow with content.
export const dynamic = "force-static";

export function GET() {
  const xml = sitemapIndexXml(subSitemaps());
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

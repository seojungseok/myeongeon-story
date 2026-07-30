import { categoryEntries, urlsetXml } from "@/lib/sitemap";

export const dynamic = "force-static";

export function GET() {
  return new Response(urlsetXml(categoryEntries()), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

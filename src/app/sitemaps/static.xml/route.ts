import { staticEntries, urlsetXml } from "@/lib/sitemap";

export const dynamic = "force-static";

export function GET() {
  return new Response(urlsetXml(staticEntries()), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

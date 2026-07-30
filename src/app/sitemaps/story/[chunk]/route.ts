import {
  storyChunkCount,
  storyChunkEntries,
  urlsetXml,
} from "@/lib/sitemap";

// One static file per story chunk. New chunks appear automatically as the
// story count crosses each STORY_CHUNK_SIZE boundary.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return Array.from({ length: storyChunkCount() }, (_, i) => ({
    chunk: String(i),
  }));
}

export function GET(
  _req: Request,
  { params }: { params: { chunk: string } },
) {
  const chunk = Number.parseInt(params.chunk, 10) || 0;
  return new Response(urlsetXml(storyChunkEntries(chunk)), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllStories } from "@/lib/content";
import { listMetadata } from "@/lib/seo";
import { SearchClient, type SearchIndexItem } from "@/components/SearchClient";

// Static page + client-side filtering. No per-request server work.
export const dynamic = "force-static";

export function generateMetadata(): Metadata {
  const meta = listMetadata({
    title: "이야기 검색",
    description: "제목·명언·태그로 마음에 닿는 명언 이야기를 검색하세요.",
    path: "/search",
  });
  // Search-result pages are intentionally not indexed (thin/duplicate), but
  // links are still followed so crawlers reach the stories.
  return { ...meta, robots: { index: false, follow: true } };
}

export default function SearchPage() {
  const index: SearchIndexItem[] = getAllStories().map((s) => ({
    id: s.id,
    title: s.title,
    quote: s.quote,
    quoteAuthor: s.quoteAuthor,
    category: s.category,
    tags: s.tags,
    image: s.image,
    createdAt: s.createdAt,
  }));

  return (
    <div className="container-wide space-y-8">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">이야기 검색</h1>
      <Suspense fallback={<p className="text-subtle">불러오는 중…</p>}>
        <SearchClient index={index} />
      </Suspense>
    </div>
  );
}

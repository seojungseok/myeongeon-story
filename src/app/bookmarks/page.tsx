import type { Metadata } from "next";
import { getAllStories } from "@/lib/content";
import { readingTimeLabel } from "@/lib/readingTime";
import { BookmarksClient } from "@/components/BookmarksClient";
import type { SearchIndexItem } from "@/components/SearchClient";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "즐겨찾기 - 명언이야기",
  description: "내가 저장한 명언 이야기 모음.",
  robots: { index: false, follow: true },
};

export default function BookmarksPage() {
  const index: SearchIndexItem[] = getAllStories().map((s) => ({
    id: s.id,
    title: s.title,
    quote: s.quote,
    quoteAuthor: s.quoteAuthor,
    category: s.category,
    tags: s.tags,
    image: s.image,
    createdAt: s.createdAt,
    readLabel: readingTimeLabel(s.story),
  }));

  return (
    <div className="container-wide space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">즐겨찾기</h1>
        <p className="mt-2 text-subtle">
          마음에 담아둔 이야기들이에요. 이 목록은 이 기기에만 저장됩니다.
        </p>
      </header>
      <BookmarksClient index={index} />
    </div>
  );
}

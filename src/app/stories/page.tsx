import type { Metadata } from "next";
import { getAllStories } from "@/lib/content";
import { listMetadata } from "@/lib/seo";
import { StoryGrid } from "@/components/StoryCard";
import { CategoryBar } from "@/components/home/CategoryBar";

export const dynamic = "force-static";

export function generateMetadata(): Metadata {
  return listMetadata({
    title: "최신 이야기",
    description: "명언이야기의 모든 이야기를 최신순으로 모았습니다.",
    path: "/stories",
  });
}

export default function StoriesPage() {
  const all = getAllStories(); // already newest-first

  return (
    <div className="container-wide space-y-8">
      <CategoryBar />
      <header>
        <h1 className="font-serif text-2xl font-bold text-ink sm:text-3xl">
          최신 이야기
        </h1>
        <p className="mt-2 text-subtle">전체 {all.length}편</p>
      </header>
      <StoryGrid stories={all} />
    </div>
  );
}

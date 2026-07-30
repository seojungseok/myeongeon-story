import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categories, getCategory } from "@/config/categories";
import { getStoriesByCategory } from "@/lib/content";
import { breadcrumbJsonLd, listMetadata } from "@/lib/seo";
import { StoryGrid } from "@/components/StoryCard";
import { CategoryList } from "@/components/CategoryList";
import { JsonLd } from "@/components/JsonLd";

export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { category: string };
}): Metadata {
  const cat = getCategory(params.category);
  if (!cat) return {};
  // Keyword-first title, e.g. "인생 명언 이야기 - 명언이야기".
  return listMetadata({
    title: `${cat.label} 명언 이야기`,
    description: `${cat.blurb} ${cat.label} 명언 이야기 모음. 마음에 남는 이야기와 오늘의 교훈을 만나보세요.`,
    path: `/category/${cat.slug}`,
  });
}

export default function CategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const cat = getCategory(params.category);
  if (!cat) notFound();

  const stories = getStoriesByCategory(cat.slug);

  return (
    <div className="container-wide space-y-8">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "홈", url: "/" },
          { name: cat.label, url: `/category/${cat.slug}` },
        ])}
      />
      <header>
        <p className="text-sm text-subtle">주제별 이야기</p>
        <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">
          {cat.label} 명언 이야기
        </h1>
        <p className="mt-2 text-subtle">
          {cat.blurb} 이야기 {stories.length}편
        </p>
      </header>

      <CategoryList active={cat.slug} />
      <StoryGrid stories={stories} />
    </div>
  );
}

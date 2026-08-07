import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { categories, getCategory } from "@/config/categories";
import { getStoriesByCategory } from "@/lib/content";
import { breadcrumbJsonLd, itemListJsonLd, listMetadata } from "@/lib/seo";
import { StoryList } from "@/components/StoryList";
import { toListItems } from "@/lib/story-list";
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
  // Keyword + situational phrase, e.g. "위로 명언 - 마음이 힘들 때 위로가 되는 글".
  return {
    ...listMetadata({
      title: `${cat.label} 명언 - ${cat.search} 글`,
      description: `${cat.search} ${cat.label} 명언 이야기 모음. ${cat.blurb} 이야기와 오늘의 교훈을 만나보세요.`,
      path: `/category/${cat.slug}`,
    }),
    keywords: [`${cat.label} 명언`, `${cat.label} 명언 이야기`, cat.search, "명언", "명언 이야기", "좋은 글"],
  };
}

export default function CategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const cat = getCategory(params.category);
  if (!cat) notFound();

  const stories = getStoriesByCategory(cat.slug);
  const others = categories.filter((c) => c.slug !== cat.slug);

  return (
    <div className="container-wide space-y-8">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "홈", url: "/" },
            { name: cat.label, url: `/category/${cat.slug}` },
          ]),
          itemListJsonLd(stories, { name: `${cat.label} 명언 이야기` }),
        ]}
      />
      <nav className="font-sans text-sm text-subtle" aria-label="위치">
        <Link href="/" className="hover:text-brand">홈</Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink">{cat.label}</span>
      </nav>
      <header>
        <p className="text-sm text-subtle">주제별 이야기</p>
        <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">
          {cat.label} 명언 이야기
        </h1>
        <p className="mt-2 text-subtle">
          {cat.search} {cat.label} 명언 이야기 {stories.length}편
        </p>
      </header>

      <CategoryList active={cat.slug} />
      <StoryList stories={toListItems(stories)} />

      {/* Cross-links to other topics — internal linking + easy next step. */}
      <section className="border-t border-line pt-8">
        <h2 className="mb-4 font-serif text-lg font-bold text-ink">
          다른 주제 이야기도 만나보세요
        </h2>
        <div className="flex flex-wrap gap-2.5">
          {others.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="chip">
              {c.label} 명언
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

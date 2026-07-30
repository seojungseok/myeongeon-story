import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { collections, getCollection } from "@/config/collections";
import { getStoriesForCollection } from "@/lib/content";
import { breadcrumbJsonLd, listMetadata } from "@/lib/seo";
import { StoryGrid } from "@/components/StoryCard";
import { JsonLd } from "@/components/JsonLd";

export const dynamicParams = false;

export function generateStaticParams() {
  return collections.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const c = getCollection(params.slug);
  if (!c) return {};
  const kw = c.keywords.join(", ");
  return {
    ...listMetadata({
      title: c.title,
      description: `${c.lead} ${c.keywords.slice(0, 3).join(", ")} 읽기 좋은 명언 이야기 모음.`,
      path: `/read/${c.slug}`,
    }),
    keywords: c.keywords,
    other: { "article:tag": kw },
  };
}

export default function CollectionPage({ params }: { params: { slug: string } }) {
  const c = getCollection(params.slug);
  if (!c) notFound();

  const stories = getStoriesForCollection(c);
  const others = collections.filter((x) => x.slug !== c.slug);

  return (
    <div className="container-wide space-y-8">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "홈", url: "/" },
          { name: c.title, url: `/read/${c.slug}` },
        ])}
      />

      <header>
        <p className="text-sm text-subtle">이런 날 읽어보세요</p>
        <h1 className="mt-1 font-serif text-2xl font-bold text-ink sm:text-3xl">
          {c.title}
        </h1>
        <p className="mt-2 max-w-2xl text-subtle">{c.lead}</p>
      </header>

      {stories.length > 0 ? (
        <StoryGrid stories={stories} />
      ) : (
        <p className="rounded-2xl border border-line bg-white/60 px-5 py-10 text-center text-subtle">
          곧 이야기가 채워집니다.
        </p>
      )}

      {/* Cross-links to the other hubs — internal linking + long-tail coverage */}
      <section className="border-t border-line pt-8">
        <h2 className="mb-4 font-serif text-lg font-bold text-ink">다른 마음의 날에는</h2>
        <div className="flex flex-wrap gap-2">
          {others.map((o) => (
            <Link key={o.slug} href={`/read/${o.slug}`} className="chip">
              {o.title}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoriesByTag } from "@/lib/content";
import { breadcrumbJsonLd, itemListJsonLd, listMetadata } from "@/lib/seo";
import { StoryList } from "@/components/StoryList";
import { toListItems } from "@/lib/story-list";
import { JsonLd } from "@/components/JsonLd";

// Tags are Korean, and Next's static-route matching doesn't reliably match
// percent-encoded Korean path segments (those pages 404). So render tag pages
// ON DEMAND (dynamicParams) — each renders on first request and is then cached.
export const dynamicParams = true;
export const revalidate = 86400;

export function generateStaticParams() {
  return [] as { tag: string }[];
}

export function generateMetadata({
  params,
}: {
  params: { tag: string };
}): Metadata {
  const tag = decodeURIComponent(params.tag);
  return listMetadata({
    title: `${tag} 명언 이야기`,
    description: `'${tag}' 태그가 담긴 명언 이야기 모음. 비슷한 마음의 이야기를 이어서 읽어보세요.`,
    path: `/tag/${encodeURIComponent(tag)}`,
  });
}

export default function TagPage({ params }: { params: { tag: string } }) {
  const tag = decodeURIComponent(params.tag);
  const stories = getStoriesByTag(tag);
  if (stories.length === 0) notFound();

  return (
    <div className="container-wide space-y-8">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "홈", url: "/" },
            { name: `#${tag}`, url: `/tag/${encodeURIComponent(tag)}` },
          ]),
          itemListJsonLd(stories, { name: `${tag} 명언 이야기` }),
        ]}
      />
      <header>
        <p className="text-sm text-subtle">태그</p>
        <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">
          #{tag}
        </h1>
        <p className="mt-2 text-subtle">이야기 {stories.length}편</p>
      </header>
      <StoryList stories={toListItems(stories)} />
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllTags, getStoriesByTag } from "@/lib/content";
import { breadcrumbJsonLd, listMetadata } from "@/lib/seo";
import { StoryGrid } from "@/components/StoryCard";
import { JsonLd } from "@/components/JsonLd";

export const dynamicParams = false;

export function generateStaticParams() {
  // One static page per tag. Tags are Korean; with dynamicParams=false Next
  // compares the RAW (encoded) request segment against these values, so we must
  // return the ENCODED form here. The page component decodes params.tag below.
  return getAllTags().map(({ tag }) => ({ tag: encodeURIComponent(tag) }));
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
        data={breadcrumbJsonLd([
          { name: "홈", url: "/" },
          { name: `#${tag}`, url: `/tag/${encodeURIComponent(tag)}` },
        ])}
      />
      <header>
        <p className="text-sm text-subtle">태그</p>
        <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">
          #{tag}
        </h1>
        <p className="mt-2 text-subtle">이야기 {stories.length}편</p>
      </header>
      <StoryGrid stories={stories} />
    </div>
  );
}

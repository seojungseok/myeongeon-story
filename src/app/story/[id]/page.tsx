import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { categoryLabel } from "@/config/categories";
import {
  getAllStories,
  getPrevNext,
  getStory,
} from "@/lib/content";
import { getRelatedStories } from "@/lib/related";
import { getSongForStory } from "@/lib/songs";
import { readingTimeLabel } from "@/lib/readingTime";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  quotationJsonLd,
  storyMetadata,
} from "@/lib/seo";
import { StoryImage } from "@/components/StoryImage";
import { StoryBody } from "@/components/StoryBody";
import { ProgressBar } from "@/components/ProgressBar";
import { BookmarkButton } from "@/components/BookmarkButton";
import { ShareButtons } from "@/components/ShareButtons";
import { PrevNextNav } from "@/components/PrevNextNav";
import { RelatedQuotes } from "@/components/RelatedQuotes";
import { StoryCard } from "@/components/StoryCard";
import { RandomStoryButton } from "@/components/RandomStoryButton";
import { CoupangBanner } from "@/components/CoupangBanner";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { AdSlot } from "@/components/AdSlot";
import { JsonLd } from "@/components/JsonLd";

// Fully static: every story is pre-rendered at build time.
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllStories().map((s) => ({ id: s.id }));
}

export function generateMetadata({
  params,
}: {
  params: { id: string };
}): Metadata {
  const story = getStory(params.id);
  if (!story) return {};
  return storyMetadata(story);
}

export default function StoryPage({ params }: { params: { id: string } }) {
  const story = getStory(params.id);
  if (!story) notFound();

  const { prev, next } = getPrevNext(story.id);
  const related = getRelatedStories(story, 5);
  const allIds = getAllStories().map((s) => s.id);
  const catLabel = categoryLabel(story.category);
  // Category-matching song, resolved from data/youtube-songs.json at build time
  // (auto-updates when `npm run fetch:youtube` refreshes the pool).
  const songId = getSongForStory(story);

  return (
    <>
      <ProgressBar />
      <JsonLd
        data={[
          articleJsonLd(story),
          quotationJsonLd(story),
          breadcrumbJsonLd([
            { name: "홈", url: "/" },
            { name: catLabel, url: `/category/${story.category}` },
            { name: story.title, url: `/story/${story.id}` },
          ]),
        ]}
      />

      <article className="container-prose">
        {/* Hero — photo with a soft, warm overlay and the title laid over it */}
        <header className="relative -mx-5 mb-6 overflow-hidden sm:mx-0 sm:rounded-2xl">
          <div className="relative aspect-[16/11] sm:aspect-[16/9]">
            <StoryImage
              story={story}
              priority
              sizes="(max-width: 768px) 100vw, 688px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/35 to-ink/5" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <nav className="mb-2 font-sans text-sm text-paper/80">
                <Link href="/" className="hover:text-paper">
                  홈
                </Link>
                <span className="mx-1.5">/</span>
                <Link
                  href={`/category/${story.category}`}
                  className="hover:text-paper"
                >
                  {catLabel}
                </Link>
              </nav>
              <h1 className="font-serif text-[1.7rem] font-bold leading-tight text-paper drop-shadow-sm sm:text-4xl">
                {story.title}
              </h1>
            </div>
          </div>
        </header>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-sans text-sm text-subtle">
            {readingTimeLabel(story.story)} · {story.createdAt}
          </span>
          <BookmarkButton id={story.id} />
        </div>

        {/* Tags */}
        {story.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {story.tags.map((tag) => (
              <Link key={tag} href={`/tag/${encodeURIComponent(tag)}`} className="chip">
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Song player at the top — press play, then read as you scroll.
            Static iframe, so scrolling never interrupts playback. */}
        {songId && (
          <div className="mt-6">
            <YouTubeEmbed id={songId} title={story.title} />
          </div>
        )}

        {/* ── AD ① : before body ── */}
        <AdSlot id="①" />

        {/* Quote — the emotional landing moment */}
        <figure className="quote-block">
          <span className="quote-mark" aria-hidden>
            &ldquo;
          </span>
          <blockquote className="quote-text">{story.quote}</blockquote>
          <figcaption className="quote-cite">— {story.quoteAuthor}</figcaption>
        </figure>

        {/* Body */}
        <StoryBody text={story.story} />

        {/* ── AD ② : mid body ── */}
        <AdSlot id="②" />

        {/* ── AD ③ : above lesson ── */}
        <AdSlot id="③" />

        {/* Lesson */}
        {story.lesson && (
          <section className="highlight-box mt-5">
            <p className="highlight-label">
              <span aria-hidden>🍃</span> 오늘의 교훈
            </p>
            <p className="text-[1.15rem] leading-relaxed text-ink">
              {story.lesson}
            </p>
          </section>
        )}

        {/* Today's action */}
        {story.todayAction && (
          <section className="highlight-box mt-5">
            <p className="highlight-label">
              <span aria-hidden>🌱</span> 오늘 실천할 한 가지
            </p>
            <p className="text-[1.15rem] leading-relaxed text-ink">
              {story.todayAction}
            </p>
          </section>
        )}

        {/* Prev / next */}
        <div className="mt-10">
          <PrevNextNav prev={prev} next={next} />
        </div>

        {/* Related quotes */}
        {story.relatedQuotes.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-xl font-bold text-ink">비슷한 명언</h2>
            <RelatedQuotes quotes={story.relatedQuotes} />
          </section>
        )}

        {/* ── AD ④ : above related stories ── */}
        <AdSlot id="④" />

        {/* Related stories */}
        {related.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-4 text-xl font-bold text-ink">관련 이야기</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {related.map((s) => (
                <StoryCard key={s.id} story={s} />
              ))}
            </div>
          </section>
        )}

        {/* Random CTA */}
        <div className="mt-10 flex justify-center">
          <RandomStoryButton ids={allIds} excludeId={story.id} />
        </div>

        {/* Share */}
        <div className="mt-10">
          <ShareButtons
            path={`/story/${story.id}`}
            title={story.title}
            quote={story.quote}
          />
        </div>

        {/* Coupang */}
        {story.coupangUrl && (
          <div className="mt-8">
            <CoupangBanner url={story.coupangUrl} />
          </div>
        )}

        {/* ── AD ⑤ : bottom ── */}
        <AdSlot id="⑤" />
      </article>
    </>
  );
}

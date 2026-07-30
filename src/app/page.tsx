import Link from "next/link";
import { site } from "@/config/site";
import { categories, categoryLabel } from "@/config/categories";
import {
  getAllStories,
  getPopularStories,
  getRecentStories,
  getStoriesByCategory,
} from "@/lib/content";
import type { Story } from "@/lib/types";
import { StoryImage } from "@/components/StoryImage";
import { StoryCard, StoryGrid } from "@/components/StoryCard";
import { SearchBar } from "@/components/SearchBar";
import { RandomStoryButton } from "@/components/RandomStoryButton";
import { CategoryBar } from "@/components/home/CategoryBar";
import { Carousel } from "@/components/home/Carousel";
import { ScrollRow } from "@/components/home/ScrollRow";

// Static + daily revalidate: date-based picks refresh once a day, no per-request work.
export const revalidate = 86400;

export default function HomePage() {
  const all = getAllStories();
  const banner = getPopularStories(5); // 오늘의 대표 이야기
  const quotes = [...all]
    .sort((a, b) => b.viewWeight - a.viewWeight)
    .slice(0, 6); // 오늘의 명언
  const popular = getPopularStories(8); // 추천 이야기
  const recent = getRecentStories(6);
  const allIds = all.map((s) => s.id);

  // Category sections: top categories that actually have stories.
  const catSections = categories
    .map((c) => ({ c, items: getStoriesByCategory(c.slug) }))
    .filter((x) => x.items.length > 0)
    .slice(0, 6);

  return (
    <div className="container-wide space-y-12">
      {/* 2) Category bar (horizontal scroll) */}
      <CategoryBar />

      {/* Compact hero + search */}
      <section className="text-center">
        <h1 className="font-serif text-3xl font-extrabold tracking-tight text-brand sm:text-4xl">
          {site.name}
        </h1>
        <p className="mx-auto mt-2 font-serif text-subtle">{site.tagline}</p>
        <div className="mx-auto mt-5 max-w-xl">
          <SearchBar />
        </div>
      </section>

      {/* 3) Main banner slide (auto) */}
      {banner.length > 0 && (
        <section>
          <Carousel interval={4000}>
            {banner.map((s) => (
              <BannerSlide key={s.id} story={s} />
            ))}
          </Carousel>
        </section>
      )}

      {/* 4) 오늘의 명언 slide */}
      {quotes.length > 0 && (
        <section>
          <SectionHead title="오늘의 명언" />
          <Carousel interval={5000}>
            {quotes.map((s) => (
              <QuoteSlide key={s.id} story={s} />
            ))}
          </Carousel>
        </section>
      )}

      {/* 5) 추천 이야기 (horizontal) */}
      {popular.length > 0 && (
        <section>
          <SectionHead title="추천 이야기" />
          <Row stories={popular} />
        </section>
      )}

      {/* 6) Category sections (horizontal) */}
      {catSections.map(({ c, items }) => (
        <section key={c.slug}>
          <SectionHead title={`${c.label} 이야기`} href={`/category/${c.slug}`} />
          <Row stories={items.slice(0, 8)} />
        </section>
      ))}

      {/* 7) 최근 올라온 이야기 (grid) */}
      <section>
        <SectionHead title="최근 올라온 이야기" />
        <StoryGrid stories={recent} />
      </section>

      {/* Random CTA */}
      <section className="rounded-2xl border border-line bg-paper-deep px-6 py-10 text-center">
        <h2 className="font-serif text-xl font-bold text-brand">
          지금 마음에 닿는 이야기 하나
        </h2>
        <p className="mt-2 font-serif text-subtle">
          무엇을 볼지 모르겠다면, 운에 맡겨보세요.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <RandomStoryButton ids={allIds} />
          <Link href="/bookmarks" className="btn-ghost">
            ★ 즐겨찾기
          </Link>
        </div>
      </section>
    </div>
  );
}

// ── local pieces ────────────────────────────────────────────────────────────

function SectionHead({ title, href }: { title: string; href?: string }) {
  return (
    <div className="section-head">
      <h2 className="font-serif text-xl font-bold text-ink sm:text-2xl">{title}</h2>
      {href && (
        <Link
          href={href}
          className="shrink-0 font-sans text-sm text-brand transition hover:text-brand-soft"
        >
          더보기 ›
        </Link>
      )}
    </div>
  );
}

/** Big banner slide: image + category label + title + intro. */
function BannerSlide({ story }: { story: Story }) {
  return (
    <Link href={`/story/${story.id}`} className="relative block">
      <div className="relative aspect-[16/11] w-full sm:aspect-[21/9]">
        <StoryImage story={story} priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-ink/5" />
        <div className="absolute inset-x-0 bottom-0 p-6 text-paper sm:p-10">
          <span className="rounded-full bg-brand/80 px-3 py-1 font-sans text-xs font-semibold backdrop-blur-sm">
            {categoryLabel(story.category)}
          </span>
          <h3 className="mt-3 font-serif text-2xl font-bold leading-tight drop-shadow sm:text-4xl">
            {story.title}
          </h3>
          <p className="mt-2 line-clamp-2 max-w-2xl font-serif text-sm opacity-90 sm:text-base">
            {story.description}
          </p>
        </div>
      </div>
    </Link>
  );
}

/** Quote slide: big serif quote over a dimmed photo. */
function QuoteSlide({ story }: { story: Story }) {
  return (
    <Link href={`/story/${story.id}`} className="relative block">
      <div className="relative aspect-[16/11] w-full sm:aspect-[16/7]">
        <StoryImage story={story} sizes="100vw" />
        <div className="absolute inset-0 bg-ink/65" />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-paper">
          <span className="font-serif text-4xl leading-none opacity-60">
            &ldquo;
          </span>
          <p className="mt-1 max-w-2xl font-serif text-xl italic leading-snug drop-shadow sm:text-3xl">
            {story.quote}
          </p>
          <p className="mt-4 font-sans text-sm opacity-90">
            — {story.quoteAuthor}
          </p>
        </div>
      </div>
    </Link>
  );
}

/** Horizontal card row. */
function Row({ stories }: { stories: Story[] }) {
  return (
    <ScrollRow>
      {stories.map((s) => (
        <div key={s.id} className="w-[78%] shrink-0 snap-start sm:w-[300px]">
          <StoryCard story={s} />
        </div>
      ))}
    </ScrollRow>
  );
}

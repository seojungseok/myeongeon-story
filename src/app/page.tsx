import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { categories, categoryLabel } from "@/config/categories";
import {
  getAllStories,
  getPopularStories,
  getRecentStories,
} from "@/lib/content";
import { getTodayQuote } from "@/lib/today";
import type { Story } from "@/lib/types";
import { StoryImage } from "@/components/StoryImage";
import { StoryCard } from "@/components/StoryCard";
import { SearchBar } from "@/components/SearchBar";
import { Carousel } from "@/components/home/Carousel";
import { ScrollRow } from "@/components/home/ScrollRow";
import { collections } from "@/config/collections";

// Static + daily revalidate: the random picks re-shuffle once a day, no per-request work.
export const revalidate = 86400;

// Home metadata — keyword-rich for Google/Naver. The <title> stays the branded
// default from layout; here we strengthen the description and keywords.
export const metadata: Metadata = {
  description:
    "명언 한 줄을 따뜻한 옛날이야기로 풀어내고 오늘의 교훈으로 마무리합니다. 인생·위로·용기·사랑·가족 등 주제별 명언 모음과 좋은 글귀, 위로가 되는 글을 매일 새로 만나보세요.",
  keywords: [
    "명언",
    "명언 모음",
    "좋은 글귀",
    "명언 이야기",
    "위로가 되는 글",
    "인생 명언",
    "오늘의 명언",
    "삶이 힘들 때 읽는 글",
    "마음이 힘들 때",
  ],
  alternates: { canonical: site.url },
};

/** Day index (UTC) — used to re-shuffle "추천" once per day, deterministically. */
function daySeed(): number {
  const d = new Date();
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
}

/** Deterministic Fisher–Yates shuffle (mulberry32) so SSG output is stable per day. */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed >>> 0;
  const rnd = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function HomePage() {
  const all = getAllStories();

  // 1) 추천(랜덤): recommended stories (by viewWeight), shuffled daily.
  const recommended = seededShuffle(getPopularStories(8), daySeed()).slice(0, 5);

  // 3) 최신글: 6 in a slider, rest via 더보기 → /stories.
  const latest = getRecentStories(6);

  // 2) 오늘의 명언: daily rotation, skipping anything already shown above so the
  // same story never appears twice on the home screen.
  const todayQuote =
    getTodayQuote([...recommended.map((s) => s.id), ...latest.map((s) => s.id)]) ??
    all[0];

  return (
    <div className="container-wide space-y-14">
      {/* Premium home hero: search first, topic discovery on click. */}
      <section className="pt-2">
        <div className="grid gap-8 border-b border-line pb-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <p className="font-sans text-sm font-semibold text-brand">오늘 마음에 남을 한 문장</p>
            <h1 className="mt-3 font-serif tracking-tight text-brand">
              <span className="block text-[2.7rem] font-extrabold leading-tight sm:text-6xl">
                {site.name}
              </span>
              <span className="mt-2 block text-xl font-bold leading-snug text-ink sm:text-3xl">
                명언 한 줄로 읽는 옛날이야기
              </span>
            </h1>
            <div className="mt-7 max-w-2xl">
              <SearchBar />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-line bg-white/55 p-4 font-sans shadow-card">
            <Metric value={all.length} label="명언 이야기" />
            <Metric value={categories.length} label="주제" />
            <Metric value={collections.length} label="상황별 모음" />
          </div>
        </div>

        <TopicExplorer />
      </section>

      {/* Situational hubs — "이런 날 읽어보세요" (long-tail landing + internal links) */}
      <section>
        <SectionHead title="이런 날 읽어보세요" />
        <div className="flex flex-wrap gap-2">
          {collections.map((c) => (
            <Link
              key={c.slug}
              href={`/read/${c.slug}`}
              className="rounded-full border border-line bg-white/70 px-4 py-2 font-sans text-sm text-ink transition hover:border-brand hover:text-brand"
            >
              {c.title}
            </Link>
          ))}
        </div>
      </section>

      {/* 1) 추천 (랜덤) — main banner */}
      {recommended.length > 0 && (
        <section>
          <SectionHead title="추천 이야기" />
          <Carousel interval={4000}>
            {recommended.map((s) => (
              <BannerSlide key={s.id} story={s} />
            ))}
          </Carousel>
        </section>
      )}

      {/* 2) 오늘의 명언 — one card */}
      {todayQuote && (
        <section>
          <SectionHead title="오늘의 명언" />
          <QuoteCard story={todayQuote} />
        </section>
      )}

      {/* 3) 최신글 보기 — slider + 더보기 */}
      {latest.length > 0 && (
        <section>
          <SectionHead title="최신글 보기" href="/stories" />
          <ScrollRow>
            {latest.map((s) => (
              <div key={s.id} className="w-[78%] shrink-0 snap-start sm:w-[300px]">
                <StoryCard story={s} />
              </div>
            ))}
          </ScrollRow>
        </section>
      )}
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

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-paper px-3 py-4 text-center">
      <p className="text-2xl font-bold text-ink">{value}</p>
      <p className="mt-1 text-xs text-subtle">{label}</p>
    </div>
  );
}

function TopicExplorer() {
  return (
    <details id="categories" className="group mt-6 rounded-2xl border border-line bg-paper-deep/70">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-sans">
        <span>
          <span className="block text-sm font-semibold text-ink">다양한 주제의 명언 보기</span>
          <span className="block text-xs text-subtle">인생, 위로, 용기, 가족처럼 필요한 마음을 골라 읽어보세요.</span>
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-paper transition group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="grid gap-2 border-t border-line px-5 py-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className="rounded-xl border border-line bg-white px-4 py-3 font-sans transition hover:border-brand-soft hover:bg-paper"
          >
            <span className="block font-semibold text-ink">{c.label} 명언</span>
            <span className="mt-1 block text-sm leading-snug text-subtle">{c.search} 글</span>
          </Link>
        ))}
      </div>
    </details>
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

/** Single quote card: big serif quote over a dimmed photo. */
function QuoteCard({ story }: { story: Story }) {
  return (
    <Link href={`/story/${story.id}`} className="relative block overflow-hidden rounded-2xl">
      <div className="relative aspect-[16/10] w-full sm:aspect-[16/6]">
        <StoryImage story={story} sizes="100vw" />
        <div className="absolute inset-0 bg-ink/65" />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-paper">
          <span className="font-serif text-4xl leading-none opacity-60">&ldquo;</span>
          <p className="mt-1 max-w-2xl font-serif text-xl italic leading-snug drop-shadow sm:text-3xl">
            {story.quote}
          </p>
          <p className="mt-4 font-sans text-sm opacity-90">— {story.quoteAuthor}</p>
        </div>
      </div>
    </Link>
  );
}

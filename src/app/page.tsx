import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { categoryLabel } from "@/config/categories";
import {
  getAllStories,
  getPopularStories,
  getRecentStories,
} from "@/lib/content";
import { getTodayPicks } from "@/lib/today";
import type { Story } from "@/lib/types";
import { StoryImage } from "@/components/StoryImage";
import { StoryCard } from "@/components/StoryCard";
import { SearchBar } from "@/components/SearchBar";
import { CategoryBar } from "@/components/home/CategoryBar";
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

  // 2) 오늘의 명언: just one, date-based.
  const todayQuote = getTodayPicks().quote ?? all[0];

  // 3) 최신글: 6 in a slider, rest via 더보기 → /stories.
  const latest = getRecentStories(6);

  return (
    <div className="container-wide space-y-12">
      {/* Category bar with edge arrows */}
      <CategoryBar />

      {/* Compact hero + search */}
      <section className="text-center">
        <h1 className="font-serif text-3xl font-extrabold tracking-tight text-brand sm:text-4xl">
          {site.name} — 명언 한 줄로 읽는 옛날이야기
        </h1>
        <p className="mx-auto mt-3 max-w-2xl font-serif leading-relaxed text-subtle">
          니체·공자·노자부터 이름 모를 옛사람의 지혜까지, <strong className="font-bold text-ink">명언 한 줄</strong>을
          할머니가 들려주듯 따뜻한 이야기로 풀어냅니다. 인생·위로·용기·사랑·가족 등
          주제별 <strong className="font-bold text-ink">명언 모음</strong>과
          위로가 되는 좋은 글귀를 매일 새로 만나보세요.
        </p>
        <div className="mx-auto mt-5 max-w-xl">
          <SearchBar />
        </div>
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

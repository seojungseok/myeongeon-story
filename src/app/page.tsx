import Link from "next/link";
import { site } from "@/config/site";
import {
  getAllStories,
  getPopularStories,
  getRecentStories,
} from "@/lib/content";
import { getTodayPicks } from "@/lib/today";
import { SearchBar } from "@/components/SearchBar";
import { TodayCards } from "@/components/TodayCards";
import { CategoryList } from "@/components/CategoryList";
import { StoryGrid } from "@/components/StoryCard";
import { RandomStoryButton } from "@/components/RandomStoryButton";

// Rebuild at most once a day so the date-based "오늘의" cards stay fresh
// without per-request work. (Pure SSG + daily ISR = minimal function calls.)
export const revalidate = 86400;

export default function HomePage() {
  const picks = getTodayPicks();
  const popular = getPopularStories(6);
  const recent = getRecentStories(9);
  const allIds = getAllStories().map((s) => s.id);

  return (
    <div className="container-wide space-y-14">
      {/* Hero + search */}
      <section className="pt-6 text-center sm:pt-10">
        <p className="font-sans text-sm tracking-wide text-brand-soft">
          오늘, 마음에 닿는 한 줄
        </p>
        <h1 className="mt-3 font-serif text-4xl font-extrabold tracking-tight text-brand sm:text-5xl">
          {site.name}
        </h1>
        <p className="mx-auto mt-4 max-w-xl font-serif text-lg leading-relaxed text-subtle">
          {site.tagline}
        </p>
        <div className="mx-auto mt-8 max-w-xl">
          <SearchBar />
        </div>
      </section>

      {/* 오늘의 4 cards */}
      <Section title="오늘의 이야기">
        <TodayCards picks={picks} />
      </Section>

      {/* Categories */}
      <Section title="주제별로 보기">
        <CategoryList />
      </Section>

      {/* Popular */}
      <Section
        title="인기 이야기"
        subtitle="많은 분들이 마음에 담아 간 이야기예요."
      >
        <StoryGrid stories={popular} />
      </Section>

      {/* Recent */}
      <Section title="최근 올라온 이야기">
        <StoryGrid stories={recent} />
      </Section>

      {/* Random CTA */}
      <section className="rounded-2xl border border-line bg-paper-deep px-6 py-12 text-center">
        <h2 className="font-serif text-2xl font-bold text-brand">
          지금 마음에 닿는 이야기 하나
        </h2>
        <p className="mt-3 font-serif text-subtle">
          무엇을 볼지 모르겠다면, 운에 맡겨보세요.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <RandomStoryButton ids={allIds} />
          <Link href="/bookmarks" className="btn-ghost">
            ★ 즐겨찾기
          </Link>
        </div>
      </section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-ink sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1 text-subtle">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

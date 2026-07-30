import Link from "next/link";
import type { TodayPicks } from "@/lib/today";
import { StoryImage } from "./StoryImage";

/**
 * The four "오늘의" cards on the home page:
 * 추천 이야기 / 가장 많이 읽은 이야기 / 오늘의 명언 / 랜덤 이야기.
 * Selections are date-based (see lib/today.ts) so they refresh daily.
 */
export function TodayCards({ picks }: { picks: TodayPicks }) {
  const cards = [
    { badge: "오늘의 추천 이야기", story: picks.featured },
    { badge: "가장 많이 읽은 이야기", story: picks.mostRead },
    { badge: "오늘의 명언", story: picks.quote, quoteOnly: true },
    { badge: "랜덤 이야기", story: picks.random },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {cards.map((c, i) =>
        c.story ? (
          <Link
            key={i}
            href={`/story/${c.story.id}`}
            className="card group relative overflow-hidden"
          >
            <div className="absolute inset-0">
              <StoryImage
                story={c.story}
                sizes="(max-width: 640px) 100vw, 50vw"
                className="opacity-90 transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/35 to-ink/5" />
            </div>
            <div className="relative flex min-h-[200px] flex-col justify-end p-6 text-paper">
              <span className="mb-2 w-fit rounded-full bg-brand/80 px-3 py-1 font-sans text-xs font-semibold backdrop-blur-sm">
                {c.badge}
              </span>
              {c.quoteOnly ? (
                <p className="font-serif text-xl italic leading-snug drop-shadow">
                  &ldquo;{c.story.quote}&rdquo;
                  <span className="mt-1.5 block font-sans text-sm not-italic opacity-90">
                    — {c.story.quoteAuthor}
                  </span>
                </p>
              ) : (
                <h3 className="font-serif text-xl font-bold leading-snug drop-shadow">
                  {c.story.title}
                </h3>
              )}
            </div>
          </Link>
        ) : (
          <div
            key={i}
            className="card flex min-h-[190px] items-center justify-center text-subtle"
          >
            {c.badge}
          </div>
        ),
      )}
    </div>
  );
}

import Link from "next/link";
import { categoryLabel } from "@/config/categories";
import { readingTimeLabel } from "@/lib/readingTime";
import type { Story } from "@/lib/types";
import { StoryImage } from "./StoryImage";

/**
 * The reusable story card used across home, category, tag, search and related
 * lists. Each card is an internal link — the backbone of internal linking.
 */
export function StoryCard({
  story,
  showExcerpt = false,
}: {
  story: Story;
  showExcerpt?: boolean;
}) {
  return (
    <Link href={`/story/${story.id}`} className="card group overflow-hidden">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-brand-tint">
        <StoryImage
          story={story}
          sizes="(max-width: 768px) 100vw, 400px"
          className="transition duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-brand/70 px-2.5 py-1 font-sans text-xs font-medium text-paper backdrop-blur-sm">
          {categoryLabel(story.category)}
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-serif text-xl font-bold leading-snug text-ink group-hover:text-brand">
          {story.title}
        </h3>
        <p className="mt-2 line-clamp-2 font-serif text-[1rem] italic text-subtle">
          &ldquo;{story.quote}&rdquo;
        </p>
        {showExcerpt && (
          <p className="mt-2 line-clamp-2 text-sm text-subtle">
            {story.description}
          </p>
        )}
        <div className="mt-3 flex items-center gap-2 font-sans text-xs text-subtle">
          <span>{readingTimeLabel(story.story)}</span>
          <span aria-hidden>·</span>
          <span>{story.createdAt}</span>
        </div>
      </div>
    </Link>
  );
}

export function StoryGrid({ stories }: { stories: Story[] }) {
  if (stories.length === 0) {
    return (
      <p className="rounded-2xl border border-line bg-white/60 px-5 py-10 text-center text-subtle">
        아직 이야기가 없습니다. 곧 채워집니다.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {stories.map((s) => (
        <StoryCard key={s.id} story={s} />
      ))}
    </div>
  );
}

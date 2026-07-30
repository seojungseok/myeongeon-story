import Link from "next/link";
import type { RelatedQuote } from "@/lib/types";

/**
 * "비슷한 명언 5개" list. When a quote carries a storyId it becomes an internal
 * link to that story — dense internal linking to keep visitors moving.
 */
export function RelatedQuotes({ quotes }: { quotes: RelatedQuote[] }) {
  if (!quotes || quotes.length === 0) return null;
  return (
    <ul className="space-y-3">
      {quotes.map((q, i) => {
        const inner = (
          <>
            <p className="text-[1.05rem] leading-relaxed text-ink">
              &ldquo;{q.text}&rdquo;
            </p>
            <p className="mt-1 text-sm text-subtle">— {q.author}</p>
          </>
        );
        return (
          <li
            key={i}
            className="rounded-2xl border border-line bg-white px-5 py-4"
          >
            {q.storyId ? (
              <Link href={`/story/${q.storyId}`} className="block hover:opacity-80">
                {inner}
              </Link>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ul>
  );
}

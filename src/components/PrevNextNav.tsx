import Link from "next/link";
import type { Story } from "@/lib/types";

/** Previous / next story navigation on the detail page. */
export function PrevNextNav({ prev, next }: { prev?: Story; next?: Story }) {
  return (
    <nav className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {prev ? (
        <Link
          href={`/story/${prev.id}`}
          className="card flex flex-col p-4 text-left"
        >
          <span className="text-xs text-subtle">← 이전 이야기</span>
          <span className="mt-1 line-clamp-1 font-semibold text-ink">
            {prev.title}
          </span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={`/story/${next.id}`}
          className="card flex flex-col p-4 text-right"
        >
          <span className="text-xs text-subtle">다음 이야기 →</span>
          <span className="mt-1 line-clamp-1 font-semibold text-ink">
            {next.title}
          </span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { categoryLabel } from "@/config/categories";
import { SearchBar } from "./SearchBar";

export type SearchIndexItem = {
  id: string;
  title: string;
  quote: string;
  quoteAuthor: string;
  category: string;
  tags: string[];
  image?: string;
  createdAt: string;
};

/**
 * Client-side search over a build-time index. The whole page is static; the
 * query lives in the URL (?q=) and filtering happens in the browser — zero
 * server function invocations per search.
 */
export function SearchClient({ index }: { index: SearchIndexItem[] }) {
  const params = useSearchParams();
  const q = (params.get("q") ?? "").trim();

  const results = useMemo(() => {
    if (!q) return [];
    const needle = q.toLowerCase();
    return index.filter((it) =>
      [it.title, it.quote, it.quoteAuthor, ...it.tags]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [q, index]);

  return (
    <div className="space-y-8">
      <div className="mx-auto max-w-xl">
        <SearchBar initial={q} />
      </div>

      {q ? (
        <p className="text-subtle">
          &lsquo;<span className="font-semibold text-ink">{q}</span>&rsquo; 검색 결과{" "}
          {results.length}건
        </p>
      ) : (
        <p className="text-subtle">찾고 싶은 명언이나 주제를 입력해 보세요.</p>
      )}

      {q && results.length === 0 && (
        <p className="rounded-2xl border border-line bg-white/60 px-5 py-10 text-center text-subtle">
          검색 결과가 없습니다. 다른 단어로 찾아보세요.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((it) => (
          <Link
            key={it.id}
            href={`/story/${it.id}`}
            className="card group overflow-hidden"
          >
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-brand-tint">
              {it.image && (
                <Image
                  src={it.image}
                  alt={it.title}
                  fill
                  sizes="(max-width:768px) 100vw, 400px"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              )}
              <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-xs font-medium text-white">
                {categoryLabel(it.category)}
              </span>
            </div>
            <div className="p-5">
              <h3 className="text-lg font-bold leading-snug text-ink group-hover:text-brand">
                {it.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-[0.95rem] italic text-subtle">
                &ldquo;{it.quote}&rdquo;
              </p>
              <div className="mt-3 text-xs text-subtle">
                {it.createdAt}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

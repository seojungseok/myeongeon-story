"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { SearchBar } from "./SearchBar";
import { StoryRow } from "./StoryList";

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

      {results.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white/60">
          {results.map((it) => (
            <li key={it.id}>
              <StoryRow story={it} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

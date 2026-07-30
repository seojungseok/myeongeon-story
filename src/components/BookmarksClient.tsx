"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { categoryLabel } from "@/config/categories";
import { getBookmarks, subscribe } from "@/lib/bookmarks";
import type { SearchIndexItem } from "./SearchClient";

/**
 * Renders the visitor's saved stories from localStorage, matched against a
 * build-time index passed by the server component.
 */
export function BookmarksClient({ index }: { index: SearchIndexItem[] }) {
  const [ids, setIds] = useState<string[] | null>(null);

  useEffect(() => {
    setIds(getBookmarks());
    return subscribe(() => setIds(getBookmarks()));
  }, []);

  if (ids === null) {
    return <p className="text-subtle">불러오는 중…</p>;
  }

  const byId = new Map(index.map((it) => [it.id, it]));
  const saved = ids.map((id) => byId.get(id)).filter(Boolean) as SearchIndexItem[];

  if (saved.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-white/60 px-5 py-12 text-center">
        <p className="text-subtle">아직 저장한 이야기가 없어요.</p>
        <Link href="/" className="btn mt-5">
          이야기 둘러보기
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {saved.map((it) => (
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
          </div>
        </Link>
      ))}
    </div>
  );
}

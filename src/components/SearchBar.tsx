"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Search box. Navigates to /search?q=... (a statically-rendered page that
 * filters client-side), so no server function is invoked per keystroke.
 */
export function SearchBar({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (term) router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  return (
    <form onSubmit={submit} className="flex w-full gap-2" role="search">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="제목·명언·태그로 이야기 찾기"
        aria-label="이야기 검색"
        className="min-w-0 w-full rounded-full border border-line bg-white px-4 py-3 font-sans text-base text-ink outline-none transition duration-250 focus:border-brand sm:px-5"
      />
      <button type="submit" className="btn shrink-0 px-5 sm:px-6">
        검색
      </button>
    </form>
  );
}

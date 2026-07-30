"use client";

import { useEffect, useState } from "react";
import { isBookmarked, subscribe, toggleBookmark } from "@/lib/bookmarks";

export function BookmarkButton({
  id,
  className = "",
}: {
  id: string;
  className?: string;
}) {
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSaved(isBookmarked(id));
    setReady(true);
    return subscribe(() => setSaved(isBookmarked(id)));
  }, [id]);

  return (
    <button
      type="button"
      onClick={() => setSaved(toggleBookmark(id))}
      aria-pressed={saved}
      aria-label={saved ? "즐겨찾기 해제" : "즐겨찾기 추가"}
      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 font-sans text-sm font-medium transition duration-250 ${
        saved
          ? "border-brand bg-brand text-white"
          : "border-line bg-white text-ink hover:border-brand-soft"
      } ${className}`}
      // Avoid a hydration flash before we know the stored state.
      style={{ visibility: ready ? "visible" : "hidden" }}
    >
      <span aria-hidden>{saved ? "★" : "☆"}</span>
      {saved ? "저장됨" : "즐겨찾기"}
    </button>
  );
}

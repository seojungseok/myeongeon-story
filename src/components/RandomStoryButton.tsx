"use client";

import { useRouter } from "next/navigation";

/**
 * "다른 이야기 보기" — jumps to a random story. Story ids are passed from a
 * server component (so the list is build-time data), and the pick happens in
 * the browser to keep the click feeling fresh without any server call.
 */
export function RandomStoryButton({
  ids,
  excludeId,
  className = "",
  label = "다른 이야기 보기",
}: {
  ids: string[];
  excludeId?: string;
  className?: string;
  label?: string;
}) {
  const router = useRouter();

  function go() {
    const pool = excludeId ? ids.filter((id) => id !== excludeId) : ids;
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    router.push(`/story/${pick}`);
  }

  return (
    <button type="button" onClick={go} className={`btn ${className}`}>
      🎲 {label}
    </button>
  );
}

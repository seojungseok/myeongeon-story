"use client";

import { useEffect, useState } from "react";

type Visits = { total: number | null; today: number | null };

/**
 * Shows "전체 방문 N · 오늘 M". Calls /api/visit once on mount (the route counts
 * at most once per browser per day). Renders nothing if the counter is
 * unavailable, so a hiccup never leaves a broken widget in the footer.
 */
export function VisitCounter() {
  const [v, setV] = useState<Visits | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/visit")
      .then((r) => r.json())
      .then((d) => alive && setV(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!v || (v.total == null && v.today == null)) return null;
  const fmt = (n: number | null) => (n == null ? "–" : n.toLocaleString("ko-KR"));

  return (
    <p className="mt-2 font-sans text-xs text-subtle">
      <span className="font-medium text-ink">전체 방문</span> {fmt(v.total)}
      <span className="mx-2 text-line">·</span>
      <span className="font-medium text-ink">오늘</span> {fmt(v.today)}
    </p>
  );
}

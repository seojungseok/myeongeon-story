import { NextRequest, NextResponse } from "next/server";

/**
 * Visit counter — returns { total, today } and (once per browser per day)
 * increments them. State lives in a free hit-counter service (abacus, no signup)
 * so the static site needs no database. Counting is gated by an httpOnly cookie
 * so a browser bumps the count at most once per day; extra page loads just read.
 *
 * If the counter service is unreachable, values come back null and the UI hides.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NS = "myeongeon-kr-v1"; // namespace on the counter service
const ABACUS = "https://abacus.jasoncameron.dev";

/** Today's date in Seoul, as YYYY-MM-DD. */
function seoulToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

/** Fetch a counter value. `hit` increments; otherwise read-only. Missing key = 0. */
async function counter(key: string, hit: boolean): Promise<number | null> {
  try {
    const res = await fetch(`${ABACUS}/${hit ? "hit" : "get"}/${NS}/${key}`, {
      cache: "no-store",
    });
    if (res.status === 404) return 0; // key not created yet
    if (!res.ok) return null;
    const json = await res.json();
    return typeof json?.value === "number" ? json.value : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const today = seoulToday();
  const alreadyToday = req.cookies.get("mv")?.value === today;
  const count = !alreadyToday; // count once per browser per day

  const [total, todayCount] = await Promise.all([
    counter("total", count),
    counter(`day-${today}`, count),
  ]);

  const res = NextResponse.json(
    { total, today: todayCount },
    { headers: { "cache-control": "no-store" } },
  );
  if (count) {
    res.cookies.set("mv", today, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 2, // 2 days
    });
  }
  return res;
}

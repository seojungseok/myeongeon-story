/**
 * generate-story.ts — turns quotes into story JSON files for src/content/stories/,
 * using Gemini. Built to run unattended (GitHub Actions cron) yet stay safe:
 *
 *  - A VALIDATION GATE rejects drift. A story is written only if it (a) parses,
 *    (b) actually ends on the given quote, (c) titles it with the given author,
 *    and (d) is a sane length. Failures are retried, then skipped — a bad story
 *    is never published.
 *  - SKIP-USED: quotes already turned into a story are skipped, so re-running
 *    daily keeps producing NEW stories from the pool without duplicates.
 *
 * The prompt/tone lives in scripts/prompt-template.txt.
 *
 * Env:
 *   GEMINI_API_KEY   required
 *   GEMINI_MODEL     default "gemini-3-flash-preview" (cost-effective)
 *
 * Usage:
 *   npm run gen:story -- --quote "…" --author 니체 --category courage
 *   npm run gen:story -- --file scripts/quotes.txt --count 10   # daily batch
 *
 * quotes.txt line format:  명언 | 카테고리슬러그 | 작가   (뒤 두 개는 생략 가능)
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
loadEnvLocal();

const MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
const TEMPLATE = fs.readFileSync(path.join(ROOT, "scripts", "prompt-template.txt"), "utf8");

const args = parseArgs(process.argv.slice(2));
const OUT_DIR = path.resolve(ROOT, (args.out as string) || "src/content/stories");
const DELAY = Number(args.delay ?? 3000);
const COUNT = args.count ? Number(args.count) : Infinity; // max stories to write
const MAX_RETRIES = 3;
const CATEGORY_HINT = typeof args.category === "string" ? (args.category as string) : "";
const AUTHOR_ARG = typeof args.author === "string" ? (args.author as string) : "";

const CATEGORY_MAP: Record<string, string> = {
  인생: "life", 위로: "comfort", 용기: "courage", 인연: "relationship",
  그리움: "longing", 성공: "success", 노력: "effort", 사랑: "love",
  친구: "friend", 행복: "happiness", 도전: "challenge", 공부: "study",
  시간: "time", 가족: "family", 희망: "hope",
};
const SLUGS = new Set(Object.values(CATEGORY_MAP));
function normalizeCategory(v: string): string {
  const t = (v || "").trim();
  if (SLUGS.has(t)) return t;
  return CATEGORY_MAP[t] || t || "life";
}

// ── text helpers for validation ─────────────────────────────────────────────
/** Strip whitespace/quotes/punctuation and NFC-normalize, for robust Korean compares. */
function norm(s: string): string {
  return (s || "").normalize("NFC").replace(/[\s"'“”‘’.,!?·…「」『』]/g, "");
}
/** The quote's longest sentence — what the story must contain verbatim. */
function quoteCore(quote: string): string {
  const parts = quote.split(/[.!?。\n]/).map((x) => x.trim()).filter(Boolean);
  return parts.sort((a, b) => b.length - a.length)[0] || quote;
}

type Job = { quote: string; category: string; author: string };
type Fields = {
  category: string; slug: string; title: string; quoteAuthor: string; story: string;
  lesson: string; todayAction: string; tags: string[]; photoKeyword: string; description: string;
};

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set."); process.exit(1);
  }

  let jobs: Job[] = [];
  if (args.file) {
    const lines = fs.readFileSync(path.resolve(ROOT, args.file as string), "utf8")
      .split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
    for (const line of lines) {
      const [q, c, a] = line.split("|").map((x) => (x ?? "").trim());
      if (q) jobs.push({ quote: q, category: c || CATEGORY_HINT, author: a || AUTHOR_ARG });
    }
  } else if (args.quote) {
    jobs.push({ quote: args.quote as string, category: CATEGORY_HINT, author: AUTHOR_ARG });
  } else {
    console.error('Provide --quote "..." or --file <path>.'); process.exit(1);
  }

  // Skip quotes that already have a story (so daily runs make NEW ones).
  const used = usedQuotes();
  const before = jobs.length;
  jobs = jobs.filter((j) => !used.has(norm(j.quote)));
  if (before !== jobs.length) console.log(`[gen] skip ${before - jobs.length} already-used quote(s).`);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`[gen] model=${MODEL}  pool=${jobs.length}  target=${COUNT === Infinity ? "all" : COUNT}`);

  let written = 0, skipped = 0;
  for (const job of jobs) {
    if (written >= COUNT) break;
    const result = await generateValid(job);
    if (result) {
      const file = writeStory(result, job);
      console.log(`  ✓ ${path.relative(ROOT, file)}`);
      written++;
    } else {
      console.warn(`  ✗ skip (검증 실패): "${job.quote.slice(0, 30)}…"`);
      skipped++;
    }
    await sleep(DELAY);
  }
  console.log(`\n[gen] done. written=${written} skipped=${skipped}`);
}

/** Generate, validate, and retry. Returns valid fields or null. */
async function generateValid(job: Job): Promise<Fields | null> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const f = await generate(job);
      const core = norm(quoteCore(job.quote));
      const quoteLanded = norm(f.story).includes(core);
      const authorOk = !job.author || norm(f.title).includes(norm(job.author));
      const lenOk = f.story.length >= 450 && f.story.length <= 1300;
      if (quoteLanded && authorOk && lenOk && f.title && f.lesson && f.todayAction) return f;
      console.warn(`    · attempt ${attempt} invalid (quote:${quoteLanded} author:${authorOk} len:${lenOk})`);
    } catch (e) {
      console.warn(`    · attempt ${attempt} error: ${(e as Error).message.slice(0, 120)}`);
    }
    if (attempt < MAX_RETRIES) await sleep(1500);
  }
  return null;
}

async function generate(job: Job): Promise<Fields> {
  const prompt = TEMPLATE
    .replace("{{QUOTE}}", job.quote)
    .replace("{{AUTHOR}}", job.author)
    .replace("{{CATEGORY}}", job.category);
  const raw = await callGemini(prompt);
  const j = extractJson(raw);
  return {
    category: String(j.category ?? "").trim(),
    slug: String(j.slug ?? "").trim(),
    title: String(j.title ?? "").trim(),
    quoteAuthor: String(j.quoteAuthor ?? job.author ?? "작자 미상").trim(),
    story: String(j.story ?? "").trim(),
    lesson: String(j.lesson ?? "").trim(),
    todayAction: String(j.todayAction ?? "").trim(),
    tags: Array.isArray(j.tags) ? j.tags.map(String) : [],
    photoKeyword: String(j.photoKeyword ?? "").trim(),
    description: String(j.description ?? "").trim(),
  };
}

async function callGemini(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY as string;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
  const generationConfig: Record<string, unknown> = {
    temperature: 0.85, responseMimeType: "application/json", maxOutputTokens: 8192,
  };
  // flash models can leak "thinking" into the JSON; disable it for clean output + cost.
  if (MODEL.includes("flash")) generationConfig.thinkingConfig = { thinkingBudget: 0 };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

function writeStory(f: Fields, job: Job): string {
  const category = normalizeCategory(job.category || f.category || "life");
  const author = job.author || f.quoteAuthor || "작자 미상";
  const title = f.title;
  // URL id MUST be ASCII — Next.js static routes don't match Korean path params
  // reliably (Korean-id pages 404). Use the model's English slug; fall back to a
  // stable hash of the quote.
  const id = asciiId(f.slug) || `story-${hashHex(job.quote)}`;
  const story = {
    id, category, tags: f.tags, title,
    quote: job.quote,                 // always the exact input quote
    quoteAuthor: author,
    story: f.story, lesson: f.lesson, todayAction: f.todayAction,
    relatedQuotes: [] as { text: string; author: string }[],
    photoKeyword: f.photoKeyword, viewWeight: 10, coupangUrl: "",
    createdAt: new Date().toISOString().slice(0, 10),
    description: f.description,
    youtubeId: "",                    // resolved at build time by src/lib/songs.ts
  };
  let file = path.join(OUT_DIR, `${id}.json`);
  if (fs.existsSync(file)) file = path.join(OUT_DIR, `${id}-${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(story, null, 2) + "\n", "utf8");
  return file;
}

/** Normalized quotes that already have a story file. */
function usedQuotes(): Set<string> {
  const set = new Set<string>();
  if (!fs.existsSync(OUT_DIR)) return set;
  for (const f of fs.readdirSync(OUT_DIR)) {
    if (!/\.(json|md|mdx)$/i.test(f)) continue;
    const text = fs.readFileSync(path.join(OUT_DIR, f), "utf8");
    const m = /\.json$/i.test(f)
      ? safeJson(text)?.quote
      : text.match(/^quote:\s*["']?(.+?)["']?\s*$/m)?.[1];
    if (m) set.add(norm(String(m)));
  }
  return set;
}
function safeJson(t: string): any { try { return JSON.parse(t); } catch { return null; } }

function extractJson(text: string): Record<string, any> {
  const c = text.replace(/```json|```/g, "").trim();
  const start = c.indexOf("{");
  if (start === -1) throw new Error("No JSON in model output.");
  // Scan for the first balanced {…} object; ignore any trailing junk the model
  // sometimes appends after the JSON (which broke naive first{…last} slicing).
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < c.length; i++) {
    const ch = c[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
    } else if (ch === '"') inStr = true;
    else if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) return JSON.parse(c.slice(start, i + 1)); }
  }
  throw new Error("No balanced JSON in model output.");
}

/** ASCII-only slug for the URL id. Returns "" if nothing usable remains. */
function asciiId(seed: string): string {
  return (seed || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}
/** Short stable hex hash — fallback id when no ASCII slug is available. */
function hashHex(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16);
}

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2), next = argv[i + 1];
      if (next && !next.startsWith("--")) { out[key] = next; i++; } else out[key] = true;
    }
  }
  return out;
}

function loadEnvLocal() {
  const p = path.join(ROOT, ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
main().catch((e) => { console.error("[gen] fatal:", e); process.exit(1); });

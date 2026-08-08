/**
 * generate-story.ts — turns quotes into story JSON files for src/content/stories/,
 * using Gemini. Built to run unattended (GitHub Actions cron) yet stay safe:
 *
 *  - A VALIDATION GATE rejects drift. A story is written only if it (a) parses,
 *    (b) actually ends on the given quote, (c) titles it with the given author,
 *    and (d) is a sane length. Failures are retried, then skipped — a bad story
 *    is never published.
 *  - SKIP-USED: quotes already turned into a story are skipped, so re-running
 *    daily keeps producing NEW stories without duplicates.
 *  - AUTO MODE (--auto): the model proposes fresh, real, famous quotes each run
 *    (avoiding every quote already used), so the daily job never runs dry. No
 *    static list to refill. Use --count to set how many stories per run.
 *
 * The prompt/tone lives in scripts/prompt-template.txt.
 *
 * Provider: OpenAI by default (GPT-5.6 Luna). The Gemini path is kept intact so
 * you can switch back later with a single env var (AI_PROVIDER=gemini) — no code
 * change needed. Right now, with AI_PROVIDER unset, it runs on OpenAI only.
 *
 * Env:
 *   AI_PROVIDER      "openai" (default) | "gemini"
 *   OPENAI_API_KEY   required when AI_PROVIDER=openai
 *   OPENAI_MODEL     default "gpt-5.6-luna" (fast, cost-efficient)
 *   GEMINI_API_KEY   required when AI_PROVIDER=gemini
 *   GEMINI_MODEL     default "gemini-3-flash-preview"
 *
 * Usage:
 *   npm run gen:story -- --auto --count 5                       # daily batch (self-sourcing)
 *   npm run gen:story -- --quote "…" --author 니체 --category courage
 *   npm run gen:story -- --file scripts/quotes.txt --count 10   # from a static list
 *
 * quotes.txt line format:  명언 | 카테고리슬러그 | 작가   (뒤 두 개는 생략 가능)
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
loadEnvLocal();

// Provider switch — OpenAI now, Gemini kept for later (flip AI_PROVIDER).
const PROVIDER = (process.env.AI_PROVIDER || "openai").toLowerCase();
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.6-luna";
const GEMINI_MODEL_ID = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
const MODEL = PROVIDER === "gemini" ? GEMINI_MODEL_ID : OPENAI_MODEL;
const TEMPLATE = fs.readFileSync(path.join(ROOT, "scripts", "prompt-template.txt"), "utf8");

const args = parseArgs(process.argv.slice(2));
const OUT_DIR = path.resolve(ROOT, (args.out as string) || "src/content/stories");
const DELAY = Number(args.delay ?? 3000);
// --auto: source fresh quotes from the model instead of a static file, so daily
// runs never run out. Default target is 5 stories/run when --count is omitted.
const AUTO = Boolean(args.auto);
const COUNT = args.count ? Number(args.count) : AUTO ? 5 : Infinity; // max stories to write
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
  if (PROVIDER === "gemini") {
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set."); process.exit(1);
    }
  } else if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is not set."); process.exit(1);
  }

  // Quotes already turned into a story — used everywhere to guarantee no dupes.
  const used = usedQuotes();

  let jobs: Job[] = [];
  if (AUTO) {
    // Let the model propose fresh, real, famous quotes we haven't used yet.
    jobs = await autoJobs(COUNT, used);
    console.log(`[gen] auto-sourced ${jobs.length} fresh quote(s) from the model.`);
  } else if (args.file) {
    const lines = fs.readFileSync(path.resolve(ROOT, args.file as string), "utf8")
      .split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
    for (const line of lines) {
      const [q, c, a] = line.split("|").map((x) => (x ?? "").trim());
      if (q) jobs.push({ quote: q, category: c || CATEGORY_HINT, author: a || AUTHOR_ARG });
    }
  } else if (args.quote) {
    jobs.push({ quote: args.quote as string, category: CATEGORY_HINT, author: AUTHOR_ARG });
  } else {
    console.error('Provide --auto, --quote "...", or --file <path>.'); process.exit(1);
  }

  // Skip quotes that already have a story (so daily runs make NEW ones).
  const before = jobs.length;
  jobs = jobs.filter((j) => !used.has(norm(j.quote)));
  if (before !== jobs.length) console.log(`[gen] skip ${before - jobs.length} already-used quote(s).`);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`[gen] provider=${PROVIDER}  model=${MODEL}  pool=${jobs.length}  target=${COUNT === Infinity ? "all" : COUNT}`);

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
      const lenOk = f.story.length >= 700 && f.story.length <= 2400;
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
  const raw = await callModel(prompt);
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

/** Route to the active provider. OpenAI is the default; Gemini stays available. */
async function callModel(prompt: string): Promise<string> {
  return PROVIDER === "gemini" ? callGemini(prompt) : callOpenAI(prompt);
}

async function callOpenAI(prompt: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY as string;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL,
      // GPT-5.6 uses max_completion_tokens (not max_tokens). Temperature is left
      // at the model default — the GPT-5 line rejects custom values; story
      // variety comes from the prompt and the diverse quote pool instead.
      max_completion_tokens: 8192,
      response_format: { type: "json_object" }, // prompt already asks for pure JSON
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
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

// ── AUTO mode: source fresh famous quotes from the model ─────────────────────
/**
 * Collect `target × 3` fresh candidate quotes (buffer for validation misses),
 * never repeating one that already has a story. Runs a few rounds because the
 * model may re-suggest used ones, which we drop.
 */
async function autoJobs(target: number, used: Set<string>): Promise<Job[]> {
  const finite = Number.isFinite(target) ? target : 5;
  const want = Math.max(finite * 3, finite + 5);
  const seen = new Set(used);                 // normalized keys, grows as we accept
  const avoid = usedQuoteTexts().slice(-1200); // recent used quotes, capped for prompt size
  const collected: Job[] = [];
  for (let round = 1; round <= 4 && collected.length < want; round++) {
    const need = Math.max(want - collected.length, 8);
    let proposed: Job[] = [];
    try {
      proposed = await proposeQuotes(need, avoid);
    } catch (e) {
      console.warn(`[gen] propose round ${round} failed: ${(e as Error).message.slice(0, 100)}`);
    }
    let added = 0;
    for (const p of proposed) {
      const key = norm(p.quote);
      if (!key || seen.has(key)) continue;    // drop dupes vs existing + this batch
      seen.add(key);
      avoid.push(p.quote);                    // and avoid repeating across rounds
      collected.push(p);
      added++;
    }
    console.log(`[gen] propose round ${round}: +${added} new (have ${collected.length}/${want}).`);
    if (proposed.length) await sleep(1000);
  }
  return collected;
}

/** Ask the model for `n` real, well-known quotes by real people, avoiding `avoid`. */
async function proposeQuotes(n: number, avoid: string[]): Promise<Job[]> {
  const slugList = Object.entries(CATEGORY_MAP).map(([k, v]) => `${k}=${v}`).join(", ");
  const avoidBlock = avoid.length
    ? `\n\n【이미 사용한 명언 — 아래와 같거나 의미가 겹치면 절대 제외】\n${avoid.map((q) => `- ${q}`).join("\n")}`
    : "";
  const prompt = `너는 한국어 명언 큐레이터다. 아래 조건에 맞는, 서로 다른 실존 인물의 "진짜" 명언 ${n}개를 골라라.

규칙:
- 반드시 실재하고 널리 알려진, 출처가 분명한 명언만 쓴다. 지어내지 말 것. 조금이라도 불확실하면 제외.
- 위인·철학자·작가·과학자·예술가·기업가·역사적 인물 등 유명 인물 중심으로, 저자·시대·문화가 골고루 섞이게.
- 한국어로 쓴다. 외국어 원문은 자연스러운 한국어 번역으로.
- 각 명언에 가장 잘 맞는 카테고리 슬러그 하나를 지정한다. 슬러그 목록: ${slugList}
- 짧고 인상적인 한 줄(1~2문장) 위주로.${avoidBlock}

순수 JSON만 출력(설명·코드블록 금지):
{"quotes":[{"quote":"명언 본문","author":"인물 이름","category":"슬러그"}, ...]}`;
  const raw = await callModel(prompt);
  const obj = extractJson(raw);
  const arr = Array.isArray((obj as any).quotes) ? (obj as any).quotes : [];
  return arr
    .map((x: any) => ({
      quote: String(x?.quote ?? "").trim(),
      author: String(x?.author ?? "").trim(),
      category: normalizeCategory(String(x?.category ?? "life")),
    }))
    .filter((j: Job) => j.quote);
}

/** Raw (un-normalized) quotes that already have a story file, for prompt context. */
function usedQuoteTexts(): string[] {
  const out: string[] = [];
  if (!fs.existsSync(OUT_DIR)) return out;
  for (const f of fs.readdirSync(OUT_DIR)) {
    if (!/\.(json|md|mdx)$/i.test(f)) continue;
    const text = fs.readFileSync(path.join(OUT_DIR, f), "utf8");
    const q = /\.json$/i.test(f)
      ? safeJson(text)?.quote
      : text.match(/^quote:\s*["']?(.+?)["']?\s*$/m)?.[1];
    if (q) out.push(String(q).trim());
  }
  return out;
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

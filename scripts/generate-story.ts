/**
 * generate-story.ts — admin tool. Turns a quote (or a list of quotes) into a
 * full story JSON file for src/content/stories/, using an AI provider.
 *
 * Provider is swappable via env AI_PROVIDER = gemini | openai | anthropic.
 * Default: gemini (gemini-2.5-flash) — cheapest.
 *
 * The prompt/tone lives in scripts/prompt-template.txt (edit freely).
 * Generated files are written for REVIEW — they are NOT auto-deployed. Read,
 * tweak, then commit.
 *
 * Usage:
 *   # single quote
 *   npm run gen:story -- --quote "천 리 길도 한 걸음부터." --category effort
 *
 *   # batch: a text file with one quote per line, optionally "quote | category"
 *   npm run gen:story -- --file scripts/quotes.txt
 *
 * Options:
 *   --quote "..."        one quote
 *   --category <slug>    category slug (default: life)
 *   --file <path>        batch file, one quote per line ("quote | category")
 *   --out <dir>          output dir (default: src/content/stories)
 *   --delay <ms>         delay between requests (default: 4000)
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
loadEnvLocal();

const PROVIDER = (process.env.AI_PROVIDER || "gemini").toLowerCase();
const TEMPLATE = fs.readFileSync(
  path.join(ROOT, "scripts", "prompt-template.txt"),
  "utf8",
);

// ---- args ------------------------------------------------------------------
const args = parseArgs(process.argv.slice(2));
const OUT_DIR = path.resolve(ROOT, (args.out as string) || "src/content/stories");
const DELAY = Number(args.delay ?? 4000);
// Optional category HINT. When empty, the AI picks the category itself.
const CATEGORY_HINT = typeof args.category === "string" ? (args.category as string) : "";

// Korean label → slug, so generated files store canonical slugs. Unknown values
// pass through untouched (the site's content loader also normalizes at read).
const CATEGORY_MAP: Record<string, string> = {
  인생: "life", 위로: "comfort", 용기: "courage", 인연: "relationship",
  그리움: "longing", 성공: "success", 노력: "effort", 사랑: "love",
  친구: "friend", 행복: "happiness", 도전: "challenge", 공부: "study",
  시간: "time", 가족: "family", 희망: "hope",
};
const SLUGS = new Set(Object.values(CATEGORY_MAP));

function normalizeCategory(value: string): string {
  const v = value.trim();
  if (SLUGS.has(v)) return v;
  return CATEGORY_MAP[v] || v || "life";
}

// ── YouTube song auto-assignment (optional) ──
// If data/youtube-songs.json exists (from `npm run fetch:youtube`), each story
// gets a category-matching song in its `youtubeId`. Songs rotate within a
// category so multiple stories don't all get the same one.
const SONGS_FILE = path.resolve(ROOT, "data/youtube-songs.json");
let SONGS_BY_CAT: Record<string, { youtubeId: string }[]> = {};
try {
  if (fs.existsSync(SONGS_FILE)) {
    const parsed = JSON.parse(fs.readFileSync(SONGS_FILE, "utf8"));
    SONGS_BY_CAT = parsed.byCategory || {};
  }
} catch {
  /* malformed songs file — skip assignment */
}
const songCursor: Record<string, number> = {};
function pickSong(categorySlug: string): string {
  const list = SONGS_BY_CAT[categorySlug];
  if (!list || list.length === 0) return "";
  const i = (songCursor[categorySlug] ?? 0) % list.length;
  songCursor[categorySlug] = i + 1;
  return list[i]?.youtubeId ?? "";
}

async function main() {
  const jobs: { quote: string; categoryHint: string }[] = [];

  if (args.file) {
    const lines = fs
      .readFileSync(path.resolve(ROOT, args.file as string), "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));
    for (const line of lines) {
      const [q, c] = line.split("|").map((x) => x.trim());
      // Per-line category wins; otherwise fall back to --category, else "" (AI picks).
      jobs.push({ quote: q, categoryHint: c || CATEGORY_HINT });
    }
  } else if (args.quote) {
    jobs.push({ quote: args.quote as string, categoryHint: CATEGORY_HINT });
  } else {
    console.error(
      'Provide --quote "..." or --file <path>. See header of this script for usage.',
    );
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`[gen] provider=${PROVIDER}  jobs=${jobs.length}  out=${OUT_DIR}`);

  let ok = 0;
  for (let i = 0; i < jobs.length; i++) {
    const { quote, categoryHint } = jobs[i];
    try {
      console.log(`\n[${i + 1}/${jobs.length}] "${quote}"`);
      const fields = await generate(quote, categoryHint);
      const file = writeStory(fields, quote, categoryHint);
      console.log(`  ✓ saved ${path.relative(ROOT, file)}  [${normalizeCategory(categoryHint || fields.category)}]`);
      ok++;
    } catch (e) {
      console.warn(`  ! failed: ${(e as Error).message}`);
    }
    if (i < jobs.length - 1) await sleep(DELAY); // respect free-tier RPM
  }

  console.log(`\n[gen] done. ${ok}/${jobs.length} generated. Review, then commit.`);
}

// ---- AI providers ----------------------------------------------------------

type GeneratedFields = {
  category: string;
  title: string;
  quote: string;
  quoteAuthor: string;
  story: string;
  lesson: string;
  todayAction: string;
  tags: string[];
  photoKeyword: string;
  description: string;
};

async function generate(
  quote: string,
  categoryHint: string,
): Promise<GeneratedFields> {
  const prompt = TEMPLATE.replace("{{QUOTE}}", quote).replace(
    "{{CATEGORY}}",
    categoryHint,
  );
  const raw =
    PROVIDER === "openai"
      ? await callOpenAI(prompt)
      : PROVIDER === "anthropic"
        ? await callAnthropic(prompt)
        : await callGemini(prompt);

  const json = extractJson(raw);
  return {
    category: String(json.category ?? "").trim(),
    title: String(json.title ?? "").trim(),
    quote: String(json.quote ?? "").trim(),
    quoteAuthor: String(json.quoteAuthor ?? "작자 미상").trim(),
    story: String(json.story ?? "").trim(),
    lesson: String(json.lesson ?? "").trim(),
    todayAction: String(json.todayAction ?? "").trim(),
    tags: Array.isArray(json.tags) ? json.tags.map(String) : [],
    photoKeyword: String(json.photoKeyword ?? "").trim(),
    description: String(json.description ?? "").trim(),
  };
}

async function callGemini(prompt: string): Promise<string> {
  const key = requireKey("GEMINI_API_KEY");
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9, responseMimeType: "application/json" },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function callOpenAI(prompt: string): Promise<string> {
  const key = requireKey("OPENAI_API_KEY");
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.9,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

async function callAnthropic(prompt: string): Promise<string> {
  const key = requireKey("ANTHROPIC_API_KEY");
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      temperature: 0.9,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data?.content?.[0]?.text ?? "";
}

// ---- output ----------------------------------------------------------------

function writeStory(
  f: GeneratedFields,
  quote: string,
  categoryHint: string,
): string {
  const id = makeId(f.title || quote);
  // Category: explicit hint wins, else the AI's choice, else "life".
  const category = normalizeCategory(categoryHint || f.category || "life");
  const story = {
    id,
    category,
    tags: f.tags,
    title: f.title,
    // Always keep the EXACT input quote (never let the model alter it).
    quote,
    quoteAuthor: f.quoteAuthor || "작자 미상",
    story: f.story,
    lesson: f.lesson,
    todayAction: f.todayAction,
    relatedQuotes: [] as { text: string; author: string }[],
    photoKeyword: f.photoKeyword,
    viewWeight: 10,
    coupangUrl: "",
    createdAt: new Date().toISOString().slice(0, 10),
    description: f.description,
    // Category-matching song (empty string if no youtube-songs.json / no match).
    youtubeId: pickSong(category),
  };
  // Suffix a short hash if the file exists, to avoid clobbering.
  let file = path.join(OUT_DIR, `${id}.json`);
  if (fs.existsSync(file)) file = path.join(OUT_DIR, `${id}-${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(story, null, 2) + "\n", "utf8");
  return file;
}

// ---- helpers ---------------------------------------------------------------

function extractJson(text: string): Record<string, any> {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found in AI response.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function makeId(seed: string): string {
  const base = seed
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || `story-${Date.now()}`;
}

function requireKey(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set in .env.local`);
  return v;
}

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        out[key] = next;
        i++;
      } else out[key] = true;
    }
  }
  return out;
}

function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

main().catch((e) => {
  console.error("[gen] fatal:", e);
  process.exit(1);
});

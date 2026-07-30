/**
 * cache-images.ts — runs BEFORE the build (see package.json "prebuild").
 *
 * For every story it reads the `photoKeyword`, searches Pexels ONCE, downloads
 * the best photo, and saves it to public/images/pexels/<slug>.jpg. At runtime
 * the site serves only these local files — zero image API calls in production.
 *
 * - Skips images that already exist (so re-runs are cheap and incremental).
 * - Respects Pexels rate limits with a small delay between requests.
 * - If PEXELS_API_KEY is missing, it logs a warning and exits 0 (build still
 *   works; stories fall back to a gradient placeholder).
 *
 * Usage:  npm run cache:images        (or automatically via prebuild)
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const STORIES_DIR = path.join(ROOT, "src", "content", "stories");
const OUT_DIR = path.join(ROOT, "public", "images", "pexels");
const PEXELS_KEY = process.env.PEXELS_API_KEY;

// Load .env.local manually (scripts run outside Next's env loading).
loadEnvLocal();

type StoryLite = { id: string; photoKeyword: string };

function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

function imageSlug(s: StoryLite): string {
  const base = (s.photoKeyword || s.id || "story")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "story";
}

function readStories(): StoryLite[] {
  if (!fs.existsSync(STORIES_DIR)) return [];
  const out: StoryLite[] = [];
  for (const file of fs.readdirSync(STORIES_DIR)) {
    const full = path.join(STORIES_DIR, file);
    try {
      if (/\.json$/i.test(file)) {
        const parsed = JSON.parse(fs.readFileSync(full, "utf8"));
        const items = Array.isArray(parsed) ? parsed : [parsed];
        for (const it of items)
          out.push({
            id: String(it.id ?? file),
            photoKeyword: String(it.photoKeyword ?? ""),
          });
      } else if (/\.(md|mdx)$/i.test(file)) {
        const { data } = matter(fs.readFileSync(full, "utf8"));
        out.push({
          id: String(data.id ?? file),
          photoKeyword: String(data.photoKeyword ?? ""),
        });
      }
    } catch (e) {
      console.warn(`  ! skip ${file}: ${(e as Error).message}`);
    }
  }
  return out;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchPhotoUrl(keyword: string): Promise<string | null> {
  const q = encodeURIComponent(keyword || "calm nature");
  const url = `https://api.pexels.com/v1/search?query=${q}&per_page=1&orientation=landscape`;
  const res = await fetch(url, { headers: { Authorization: PEXELS_KEY! } });
  if (!res.ok) {
    console.warn(`  ! Pexels ${res.status} for "${keyword}"`);
    return null;
  }
  const data = (await res.json()) as {
    photos?: { src?: { large2x?: string; large?: string } }[];
  };
  const photo = data.photos?.[0];
  return photo?.src?.large2x || photo?.src?.large || null;
}

async function download(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const stories = readStories();
  console.log(`[cache-images] ${stories.length} stories found.`);

  if (!PEXELS_KEY) {
    console.warn(
      "[cache-images] PEXELS_API_KEY not set — skipping downloads. " +
        "Stories will use a gradient placeholder.",
    );
    return;
  }

  // De-dupe by target filename so shared keywords download once.
  const targets = new Map<string, string>(); // slug -> keyword
  for (const s of stories) targets.set(imageSlug(s), s.photoKeyword);

  let downloaded = 0;
  let skipped = 0;
  for (const [slug, keyword] of targets) {
    const dest = path.join(OUT_DIR, `${slug}.jpg`);
    if (fs.existsSync(dest)) {
      skipped++;
      continue;
    }
    try {
      const photoUrl = await fetchPhotoUrl(keyword);
      if (!photoUrl) continue;
      await download(photoUrl, dest);
      downloaded++;
      console.log(`  ✓ ${slug}.jpg  ← "${keyword}"`);
      await sleep(400); // stay well under Pexels rate limits
    } catch (e) {
      console.warn(`  ! ${slug}: ${(e as Error).message}`);
    }
  }

  console.log(
    `[cache-images] done. downloaded=${downloaded}, skipped(existing)=${skipped}`,
  );
}

main().catch((e) => {
  console.error("[cache-images] fatal:", e);
  // Don't fail the build over images.
  process.exit(0);
});

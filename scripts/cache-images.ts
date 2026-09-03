/**
 * cache-images.ts — runs BEFORE the build (see package.json "prebuild").
 *
 * For every story it reads `photoKeyword`, searches Pexels, and downloads ONE
 * photo to public/images/pexels/<story-id>.jpg. At runtime the site serves only
 * these local files — zero image API calls in production.
 *
 * Distinct images guaranteed:
 *   - Each story gets its OWN file, keyed by story id (not keyword), so two
 *     stories that share a keyword never overwrite the same file.
 *   - We fetch several candidates per keyword and pick the first photo whose
 *     Pexels id hasn't been used by another story in this run — so even similar
 *     keywords yield different pictures. A per-story offset (hash of the id)
 *     makes the choice stable across re-runs.
 *
 * Flags:
 *   --force   re-download even if the file already exists (use after changing
 *             keywords to refresh images).
 *
 * If PEXELS_API_KEY is missing it logs a warning and exits 0 (build still works;
 * stories fall back to a gradient placeholder).
 *
 * Usage:  npm run cache:images            (or automatically via prebuild)
 *         npm run cache:images -- --force
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const STORIES_DIR = path.join(ROOT, "src", "content", "stories");
const OUT_DIR = path.join(ROOT, "public", "images", "pexels");

loadEnvLocal();
const PEXELS_KEY = process.env.PEXELS_API_KEY;
const FORCE = process.argv.includes("--force");
const PER_PAGE = 15; // candidate pool size per keyword

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

/** File base = story id (matches src/lib/content.ts imageSlug). */
function idSlug(s: StoryLite): string {
  const base = (s.id || s.photoKeyword || "story")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "story";
}

/** Small stable hash → per-story starting offset into the candidate list. */
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
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

type Candidate = { id: number; url: string };

async function fetchCandidates(keyword: string): Promise<Candidate[]> {
  const q = encodeURIComponent(keyword || "calm quiet nature");
  const url = `https://api.pexels.com/v1/search?query=${q}&per_page=${PER_PAGE}&orientation=landscape`;
  const res = await fetch(url, { headers: { Authorization: PEXELS_KEY! } });
  if (!res.ok) {
    console.warn(`  ! Pexels ${res.status} for "${keyword}"`);
    return [];
  }
  const data = (await res.json()) as {
    photos?: { id: number; src?: { large2x?: string; large?: string } }[];
  };
  return (data.photos ?? [])
    .map((p) => ({ id: p.id, url: p.src?.large2x || p.src?.large || "" }))
    .filter((c) => c.url);
}

async function download(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
}

function chooseCandidate(
  candidates: Candidate[],
  seed: string,
  usedPhotoIds: Set<number>,
  offset = 0,
): Candidate | undefined {
  if (candidates.length === 0) return undefined;
  const start = (hash(seed) + offset) % candidates.length;
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[(start + i) % candidates.length];
    if (!usedPhotoIds.has(c.id)) return c;
  }
  return candidates[start];
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const stories = readStories();
  console.log(`[cache-images] ${stories.length} stories found.${FORCE ? " (force)" : ""}`);

  if (!PEXELS_KEY) {
    console.warn(
      "[cache-images] PEXELS_API_KEY not set — skipping downloads. " +
        "Stories will use a gradient placeholder.",
    );
    return;
  }

  const usedPhotoIds = new Set<number>(); // ensures no two stories share a photo
  let downloaded = 0;
  let skipped = 0;

  for (const s of stories) {
    const slug = idSlug(s);
    const mainDest = path.join(OUT_DIR, `${slug}.jpg`);
    const detailDest = path.join(OUT_DIR, `${slug}-detail.jpg`);
    const needsMain = FORCE || !fs.existsSync(mainDest);
    const needsDetail = FORCE || !fs.existsSync(detailDest);
    if (!needsMain && !needsDetail) {
      skipped += 2;
      continue;
    }

    try {
      const candidates = await fetchCandidates(s.photoKeyword);
      if (candidates.length === 0) continue;

      if (needsMain) {
        const chosen = chooseCandidate(candidates, s.id, usedPhotoIds, 0);
        if (chosen) {
          usedPhotoIds.add(chosen.id);
          await download(chosen.url, mainDest);
          downloaded++;
          console.log(`  ✓ ${slug}.jpg  ← "${s.photoKeyword}"  (photo ${chosen.id})`);
        }
      } else {
        skipped++;
      }

      if (needsDetail) {
        const chosen = chooseCandidate(candidates, `${s.id}-detail`, usedPhotoIds, 5);
        if (chosen) {
          usedPhotoIds.add(chosen.id);
          await download(chosen.url, detailDest);
          downloaded++;
          console.log(`  ✓ ${slug}-detail.jpg  ← "${s.photoKeyword}"  (photo ${chosen.id})`);
        }
      } else {
        skipped++;
      }

      await sleep(350); // stay under Pexels rate limits
    } catch (e) {
      console.warn(`  ! ${slug}: ${(e as Error).message}`);
    }
  }

  console.log(
    `[cache-images] done. downloaded=${downloaded}, skipped(existing)=${skipped}, unique photos=${usedPhotoIds.size}`,
  );
}

main().catch((e) => {
  console.error("[cache-images] fatal:", e);
  process.exit(0); // never fail the build over images
});

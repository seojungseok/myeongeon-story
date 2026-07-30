/**
 * fetch-youtube.ts — admin tool.
 *
 * Fetches EVERY video from a YouTube channel (via the Data API v3), classifies
 * each video by its TITLE into one of the 15 명언이야기 categories, and writes
 * the result to data/youtube-songs.json.
 *
 * That file lets story generation auto-assign a category-matching song to a
 * story's `youtubeId` (see scripts/generate-story.ts).
 *
 * Env:   YOUTUBE_API_KEY   (https://console.cloud.google.com → YouTube Data API v3)
 * Usage: npm run fetch:youtube
 *        npm run fetch:youtube -- --channel UCxxxx --out data/youtube-songs.json
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
loadEnvLocal();

const args = parseArgs(process.argv.slice(2));
const CHANNEL_ID = (args.channel as string) || "UCGNCbGigMXMlagvb8t6CbFA";
const OUT = path.resolve(ROOT, (args.out as string) || "data/youtube-songs.json");
const API_KEY = process.env.YOUTUBE_API_KEY;

// ── Category classifier ──────────────────────────────────────────────────────
// Ordered most-specific → most-general. On a score tie, the earlier entry wins.
const CATEGORIES: { slug: string; label: string; keywords: string[] }[] = [
  { slug: "family", label: "가족", keywords: ["가족", "엄마", "어머니", "어무이", "아버지", "아빠", "부모", "어버이", "자식", "아들", "딸", "형제", "남매", "고향", "효"] },
  { slug: "love", label: "사랑", keywords: ["사랑", "연인", "그대", "당신", "임", "첫사랑", "짝사랑", "연애", "애인", "그리운 임"] },
  { slug: "longing", label: "그리움", keywords: ["그리움", "그리워", "그립", "보고싶", "보고 싶", "추억", "이별", "떠난", "떠나", "잊지", "못 잊", "옛사랑", "눈물"] },
  { slug: "friend", label: "친구", keywords: ["친구", "우정", "벗", "동무", "동창", "옛 친구"] },
  { slug: "relationship", label: "인연", keywords: ["인연", "만남", "옷깃", "연분", "스침", "운명처럼"] },
  { slug: "comfort", label: "위로", keywords: ["위로", "괜찮아", "힘내", "토닥", "울지마", "울지 마", "지친", "아프지", "쉬어", "괜찮다"] },
  { slug: "courage", label: "용기", keywords: ["용기", "이겨", "일어나", "일어서", "버텨", "견뎌", "강해", "굳세", "당당"] },
  { slug: "challenge", label: "도전", keywords: ["도전", "시작", "새로운", "부딪", "뛰어", "달려"] },
  { slug: "effort", label: "노력", keywords: ["노력", "땀", "열심", "최선", "인내", "참고", "묵묵", "고생"] },
  { slug: "success", label: "성공", keywords: ["성공", "부자", "대박", "출세", "이루", "정상", "금의환향"] },
  { slug: "study", label: "공부", keywords: ["공부", "배움", "학교", "지혜", "깨달", "스승", "책"] },
  { slug: "hope", label: "희망", keywords: ["희망", "내일", "꿈", "별", "빛", "새벽", "봄날", "봄", "피어", "다시 핀"] },
  { slug: "happiness", label: "행복", keywords: ["행복", "웃음", "웃어", "기쁨", "즐거", "미소", "좋은 날", "신나"] },
  { slug: "time", label: "시간", keywords: ["시간", "세월", "흘러", "지나", "어느새", "오늘", "하루", "청춘 시절"] },
  { slug: "life", label: "인생", keywords: ["인생", "삶", "살아", "산다", "운명", "팔자", "청춘", "나이", "황혼", "인생길"] },
];

type Classification = { slug: string; label: string; matched: boolean };

let fallbackCounter = 0;
function classify(title: string): Classification {
  const t = title.replace(/\s+/g, " ");
  let best = { slug: "", label: "", score: 0 };
  for (const c of CATEGORIES) {
    let score = 0;
    for (const kw of c.keywords) if (t.includes(kw)) score++;
    if (score > best.score) best = { slug: c.slug, label: c.label, score };
  }
  if (best.score > 0) return { slug: best.slug, label: best.label, matched: true };
  // No keyword hit → distribute round-robin so every category gets some songs.
  const c = CATEGORIES[fallbackCounter++ % CATEGORIES.length];
  return { slug: c.slug, label: c.label, matched: false };
}

// ── YouTube API ──────────────────────────────────────────────────────────────
type Video = {
  youtubeId: string;
  title: string;
  publishedAt: string;
  category: string;
  categoryLabel: string;
  matched: boolean;
};

async function api(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube API ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

async function getUploadsPlaylistId(channelId: string): Promise<string> {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${API_KEY}`;
  const data = await api(url);
  const uploads =
    data?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads)
    throw new Error(`Channel "${channelId}" not found or has no uploads.`);
  return uploads;
}

async function getAllVideos(playlistId: string): Promise<Video[]> {
  const videos: Video[] = [];
  let pageToken = "";
  let page = 0;

  do {
    const url =
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails` +
      `&playlistId=${playlistId}&maxResults=50&key=${API_KEY}` +
      (pageToken ? `&pageToken=${pageToken}` : "");
    const data = await api(url);
    page++;

    for (const item of data.items ?? []) {
      const title: string = item?.snippet?.title ?? "";
      const youtubeId: string =
        item?.contentDetails?.videoId ?? item?.snippet?.resourceId?.videoId ?? "";
      // Skip private/deleted placeholders.
      if (!youtubeId || title === "Private video" || title === "Deleted video")
        continue;
      const cls = classify(title);
      videos.push({
        youtubeId,
        title,
        publishedAt:
          item?.contentDetails?.videoPublishedAt ??
          item?.snippet?.publishedAt ??
          "",
        category: cls.slug,
        categoryLabel: cls.label,
        matched: cls.matched,
      });
    }

    process.stdout.write(`\r  fetched ${videos.length} videos (page ${page})…`);
    pageToken = data.nextPageToken ?? "";
  } while (pageToken);

  process.stdout.write("\n");
  return videos;
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!API_KEY) {
    console.error("YOUTUBE_API_KEY is not set in .env.local. Aborting.");
    process.exit(1);
  }

  console.log(`[youtube] channel=${CHANNEL_ID}`);
  const uploads = await getUploadsPlaylistId(CHANNEL_ID);
  const videos = await getAllVideos(uploads);

  // Group by category for easy lookup during story generation.
  const byCategory: Record<string, { youtubeId: string; title: string; publishedAt: string }[]> = {};
  for (const c of CATEGORIES) byCategory[c.slug] = [];
  for (const v of videos) {
    (byCategory[v.category] ??= []).push({
      youtubeId: v.youtubeId,
      title: v.title,
      publishedAt: v.publishedAt,
    });
  }

  const output = {
    channelId: CHANNEL_ID,
    fetchedAt: new Date().toISOString(),
    totalVideos: videos.length,
    matchedCount: videos.filter((v) => v.matched).length,
    counts: Object.fromEntries(
      CATEGORIES.map((c) => [c.slug, byCategory[c.slug].length]),
    ),
    byCategory,
    videos,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(output, null, 2) + "\n", "utf8");

  console.log(`[youtube] saved ${videos.length} videos → ${path.relative(ROOT, OUT)}`);
  console.log(
    "[youtube] per-category:",
    CATEGORIES.map((c) => `${c.label} ${byCategory[c.slug].length}`).join("  "),
  );
}

// ── helpers ──────────────────────────────────────────────────────────────────
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

main().catch((e) => {
  console.error("\n[youtube] fatal:", (e as Error).message);
  process.exit(1);
});

/**
 * fetch-youtube.ts — admin tool.
 *
 * Fetches videos from a YouTube channel (Data API v3, or public RSS fallback),
 * derives one or more **theme tags** from each video's TITLE (and description as
 * a fallback), and writes the result to data/youtube-songs.json.
 *
 * Themes — not a single bucket — are what let stories match songs precisely
 * (a 어머니 story pulls only 부모 songs, a 이별 story only 이별 songs). The site's
 * resolver (src/lib/songs.ts) matches a story to a song by theme overlap, and
 * attaches NO song rather than a mismatched one.
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

// ── Theme taxonomy ───────────────────────────────────────────────────────────
// Each theme maps to a broad category (used as a coarser fallback). Ordered
// most-specific → most-general; on a tie the earlier theme becomes "primary".
// A song can carry MULTIPLE themes (e.g. "어머니 그리워" → 부모 + 이별).
export const THEMES: { theme: string; category: string; keywords: string[] }[] = [
  { theme: "부모", category: "family", keywords: ["어머니", "어머님", "엄마", "모정", "아버지", "아버님", "아빠", "부모", "부모님", "어버이", "어무이", "불효", "효"] },
  { theme: "부부", category: "relationship", keywords: ["부부", "아내", "남편", "여보", "임자", "반쪽", "백년", "해로", "반려", "평생 함께", "평생 곁", "곁에 있어", "당신"] },
  { theme: "이별", category: "longing", keywords: ["이별", "헤어짐", "헤어진", "헤어져", "안녕", "떠나간", "떠난", "떠나", "그리운", "그리움", "그리워", "그립", "보고픈", "보고 싶", "보고싶", "눈물", "못 잊", "잊지", "아픈 사람", "생각나면"] },
  { theme: "고향", category: "longing", keywords: ["고향", "어릴적", "어릴 적", "시골", "향수", "옛집"] },
  { theme: "인연", category: "relationship", keywords: ["인연", "운명", "만남", "옷깃", "연분", "운명처럼"] },
  { theme: "사랑", category: "love", keywords: ["사랑", "첫사랑", "연인", "애인", "설레", "선물", "그대", "두근"] },
  { theme: "희망", category: "hope", keywords: ["희망", "용기", "다시", "일어서", "일어나", "힘내", "이겨", "새날", "새벽"] },
  { theme: "인생", category: "life", keywords: ["인생", "세월", "나이", "청춘", "황혼", "살아온", "살아온 날"] },
  { theme: "친구", category: "friend", keywords: ["친구", "우정", "벗", "동무", "동창"] },
];

type Classification = { themes: string[]; category: string };

/** Score each theme by keyword hits in `text`; return matched themes + primary category. */
function classifyText(text: string): { themes: string[]; primary: string | null; scores: Record<string, number> } {
  // Split hashtags/underscores into words so "#당신이란사람" is read as keywords too.
  const t = (text || "").replace(/[#_]+/g, " ").replace(/\s+/g, " ");
  const scores: Record<string, number> = {};
  let primary: string | null = null;
  let best = 0;
  for (const { theme, keywords } of THEMES) {
    let s = 0;
    for (const kw of keywords) if (t.includes(kw)) s++;
    if (s > 0) {
      scores[theme] = s;
      if (s > best) {
        best = s;
        primary = theme;
      }
    }
  }
  return { themes: Object.keys(scores), primary, scores };
}

/** Classify by TITLE first; if the title yields nothing, fall back to DESCRIPTION. */
function classify(title: string, description = ""): Classification {
  let r = classifyText(title);
  if (r.themes.length === 0 && description) r = classifyText(description);
  if (r.themes.length === 0) return { themes: [], category: "" };
  const category = THEMES.find((x) => x.theme === r.primary)?.category ?? "";
  return { themes: r.themes, category };
}

// ── YouTube API ──────────────────────────────────────────────────────────────
type Video = {
  youtubeId: string;
  title: string;
  publishedAt: string;
  themes: string[];
  category: string;
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
  const uploads = data?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) throw new Error(`Channel "${channelId}" not found or has no uploads.`);
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
      const description: string = item?.snippet?.description ?? "";
      const youtubeId: string =
        item?.contentDetails?.videoId ?? item?.snippet?.resourceId?.videoId ?? "";
      if (!youtubeId || title === "Private video" || title === "Deleted video") continue;
      const cls = classify(title, description);
      videos.push({
        youtubeId,
        title,
        publishedAt:
          item?.contentDetails?.videoPublishedAt ?? item?.snippet?.publishedAt ?? "",
        themes: cls.themes,
        category: cls.category,
        matched: cls.themes.length > 0,
      });
    }

    process.stdout.write(`\r  fetched ${videos.length} videos (page ${page})…`);
    pageToken = data.nextPageToken ?? "";
  } while (pageToken);

  process.stdout.write("\n");
  return videos;
}

// ── RSS fallback (no API key needed; returns ~15 latest videos) ──────────────
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

async function fetchViaRss(channelId: string): Promise<Video[]> {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`RSS feed ${res.status} for channel ${channelId}`);
  const xml = await res.text();

  const videos: Video[] = [];
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
  for (const entry of entries) {
    const youtubeId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] ?? "";
    const title = decodeEntities(entry.match(/<title>([^<]*)<\/title>/)?.[1] ?? "");
    const description = decodeEntities(
      entry.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1] ?? "",
    );
    const publishedAt = entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? "";
    if (!youtubeId) continue;
    const cls = classify(title, description);
    videos.push({
      youtubeId,
      title,
      publishedAt,
      themes: cls.themes,
      category: cls.category,
      matched: cls.themes.length > 0,
    });
  }
  console.log(`  fetched ${videos.length} videos via RSS`);
  return videos;
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`[youtube] channel=${CHANNEL_ID}`);

  let videos: Video[];
  if (args.raw) {
    // Classify from a locally-provided raw list of videos (e.g. fetched via the
    // server's YOUTUBE_API_KEY), without hitting the API from here.
    const raw = JSON.parse(fs.readFileSync(path.resolve(ROOT, args.raw as string), "utf8"));
    const list: any[] = Array.isArray(raw) ? raw : raw.videos ?? [];
    videos = list
      .filter((v) => v?.youtubeId && v.title !== "Private video" && v.title !== "Deleted video")
      .map((v) => {
        const cls = classify(String(v.title ?? ""), String(v.description ?? ""));
        return {
          youtubeId: String(v.youtubeId),
          title: String(v.title ?? ""),
          publishedAt: String(v.publishedAt ?? ""),
          themes: cls.themes,
          category: cls.category,
          matched: cls.themes.length > 0,
        };
      });
    console.log(`  classified ${videos.length} videos from ${args.raw}`);
  } else if (API_KEY) {
    const uploads = await getUploadsPlaylistId(CHANNEL_ID);
    videos = await getAllVideos(uploads);
  } else {
    console.warn(
      "[youtube] YOUTUBE_API_KEY 없음 → 공개 RSS로 최신 ~15편만 수집합니다.\n" +
        "           (전체 목록이 필요하면 .env.local에 키를 넣고 다시 실행하세요.)",
    );
    videos = await fetchViaRss(CHANNEL_ID);
  }

  // Index by theme (precise matching) and by category (coarse fallback).
  const byTheme: Record<string, string[]> = {};
  for (const { theme } of THEMES) byTheme[theme] = [];
  const byCategory: Record<string, string[]> = {};
  for (const v of videos) {
    for (const th of v.themes) (byTheme[th] ??= []).push(v.youtubeId);
    if (v.category) (byCategory[v.category] ??= []).push(v.youtubeId);
  }

  const output = {
    channelId: CHANNEL_ID,
    source: API_KEY ? "api" : "rss",
    fetchedAt: new Date().toISOString(),
    totalVideos: videos.length,
    matchedCount: videos.filter((v) => v.matched).length,
    themeCounts: Object.fromEntries(THEMES.map((t) => [t.theme, byTheme[t.theme].length])),
    byTheme,
    byCategory,
    videos,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(output, null, 2) + "\n", "utf8");

  console.log(`[youtube] saved ${videos.length} videos → ${path.relative(ROOT, OUT)}`);
  console.log(
    "[youtube] per-theme:",
    THEMES.map((t) => `${t.theme} ${byTheme[t.theme].length}`).join("  "),
  );
  const unmatched = videos.filter((v) => !v.matched);
  if (unmatched.length) {
    console.log(`[youtube] 주제 미분류 ${unmatched.length}편 (노래 안 붙음):`);
    for (const v of unmatched) console.log(`   · ${v.title}`);
  }
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

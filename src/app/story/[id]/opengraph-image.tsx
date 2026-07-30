import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getAllStories, getStory } from "@/lib/content";
import { site } from "@/config/site";

// Pre-generate one OG image per story at build time (no runtime cost).
export const dynamicParams = false;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "명언이야기";

// @vercel/og (satori) resolves its default font via fileURLToPath(import.meta.url).
// When the project lives under a NON-ASCII path (e.g. a Korean folder name on a
// local Windows machine), that path percent-encodes and fileURLToPath throws
// "Invalid URL", breaking prerender. Vercel builds under an ASCII path, so this
// only skips OG generation on such local machines — deploys are unaffected.
const CWD_IS_ASCII = /^[\x00-\x7F]*$/.test(process.cwd());

export function generateStaticParams() {
  if (!CWD_IS_ASCII) return [];
  return getAllStories().map((s) => ({ id: s.id }));
}

/** Read the cached local photo and return it as a data URI, or null. */
function backgroundDataUri(image?: string): string | null {
  if (!image) return null;
  try {
    const file = path.join(process.cwd(), "public", image.replace(/^\//, ""));
    if (!fs.existsSync(file)) return null;
    const buf = fs.readFileSync(file);
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export default function OgImage({ params }: { params: { id: string } }) {
  const story = getStory(params.id);
  const bg = backgroundDataUri(story?.image);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px",
          background: bg ? "#2b2620" : "linear-gradient(135deg,#a6603f,#7a8b6f)",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {bg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bg}
            alt=""
            width={1200}
            height={630}
            style={{
              position: "absolute",
              inset: 0,
              width: "1200px",
              height: "630px",
              objectFit: "cover",
              opacity: 0.4,
            }}
          />
        )}

        <div style={{ display: "flex", color: "#fff", fontSize: 30, opacity: 0.9 }}>
          {site.name}
        </div>

        <div style={{ display: "flex", flexDirection: "column", color: "#fff" }}>
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              lineHeight: 1.25,
              display: "flex",
            }}
          >
            &ldquo;{(story?.quote ?? "").slice(0, 60)}&rdquo;
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 34,
              opacity: 0.92,
              display: "flex",
            }}
          >
            {(story?.title ?? site.name).slice(0, 42)}
          </div>
          <div style={{ marginTop: 14, fontSize: 26, opacity: 0.8, display: "flex" }}>
            — {story?.quoteAuthor ?? "작자 미상"}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

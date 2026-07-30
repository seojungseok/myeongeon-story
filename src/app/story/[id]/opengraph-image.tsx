import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getStory } from "@/lib/content";
import { site } from "@/config/site";

// OG images are rendered ON DEMAND (at request time), not at build. Auto-generated
// stories can occasionally carry content or a cached photo that makes @vercel/og
// throw during rendering ("RangeError: … DataView"); doing it at build would fail
// the whole deploy. Rendering per-request keeps the build bulletproof — at worst a
// single social-preview image 500s while the site and every page still ship.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "명언이야기";
export const dynamic = "force-dynamic";

// Never prerender at build (empty list); Next generates each image on first request.
export function generateStaticParams() {
  return [] as { id: string }[];
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

import { ImageResponse } from "next/og";
import { site } from "@/config/site";
import { categories } from "@/config/categories";

// Default OG / KakaoTalk share card for the site (home, category, tag, search —
// any page without its own image). Warm ivory→sepia to match the analog design.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = site.name;

// @vercel/og resolves its default font via fileURLToPath(import.meta.url), which
// throws on NON-ASCII project paths (e.g. a Korean folder name on local Windows).
// Returning [] there skips generation locally; Vercel (ASCII path) generates it.
const CWD_IS_ASCII = /^[\x00-\x7F]*$/.test(process.cwd());

export function generateImageMetadata() {
  if (!CWD_IS_ASCII) return [];
  return [{ id: "default", size, contentType, alt }];
}

export default function OgImage() {
  const pills = categories.slice(0, 5).map((c) => c.label);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background:
            "linear-gradient(135deg, #FBF8F3 0%, #F3E9D8 52%, #E9D6B8 100%)",
          fontFamily: "serif",
          position: "relative",
        }}
      >
        {/* Elegant inner frame */}
        <div
          style={{
            position: "absolute",
            inset: 26,
            border: "2px solid rgba(138,111,88,0.32)",
            borderRadius: 28,
          }}
        />
        {/* Oversized decorative quotation mark */}
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 60,
            fontSize: 300,
            lineHeight: 1,
            color: "rgba(138,111,88,0.15)",
            display: "flex",
          }}
        >
          &ldquo;
        </div>

        {/* Top brand row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            color: "#8A6F58",
            fontSize: 30,
            fontFamily: "sans-serif",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 14,
              height: 14,
              borderRadius: 14,
              background: "#A6603F",
            }}
          />
          <div style={{ display: "flex" }}>myeongeon.kr</div>
        </div>

        {/* Center — name + tagline */}
        <div style={{ display: "flex", flexDirection: "column", zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              fontSize: 112,
              fontWeight: 800,
              color: "#4A3B31",
              letterSpacing: "-2px",
            }}
          >
            {site.name}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 20,
              fontSize: 40,
              color: "#6E635A",
              lineHeight: 1.3,
            }}
          >
            {site.tagline}
          </div>
        </div>

        {/* Topic pills */}
        <div style={{ display: "flex", gap: 14, zIndex: 1 }}>
          {pills.map((p) => (
            <div
              key={p}
              style={{
                display: "flex",
                padding: "10px 24px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(138,111,88,0.32)",
                color: "#5B4A3F",
                fontSize: 30,
                fontFamily: "sans-serif",
              }}
            >
              {p}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}

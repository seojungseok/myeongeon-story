import { ImageResponse } from "next/og";
import { site } from "@/config/site";

// Default OG image for the site (home, category, tag, search — any page without
// its own). Warm ivory tone to match the analog design.
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
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#FBF8F3",
          fontFamily: "serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 24,
            border: "2px solid #E7DECF",
            borderRadius: 24,
          }}
        />
        <div style={{ display: "flex", fontSize: 120, color: "#8A6F58" }}>
          &ldquo;
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 84,
            fontWeight: 800,
            color: "#5B4A3F",
            marginTop: -20,
          }}
        >
          {site.name}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 34,
            color: "#6E635A",
            marginTop: 24,
          }}
        >
          {site.tagline}
        </div>
      </div>
    ),
    { ...size },
  );
}

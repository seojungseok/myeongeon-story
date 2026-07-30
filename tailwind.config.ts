import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,md,mdx}"],
  theme: {
    extend: {
      colors: {
        // Warm, analog palette — like aged letter paper and a well-thumbed book.
        paper: "#FBF8F3", // 기본 배경 (미색)
        "paper-deep": "#F5EFE4", // 박스·섹션 구분
        ink: "#3A3532", // 본문 먹색
        subtle: "#6E635A", // 보조 텍스트
        line: "#E7DECF", // 옅은 테두리/구분선
        brand: {
          DEFAULT: "#5B4A3F", // 깊은 브라운
          soft: "#8A6F58", // 세피아
          tint: "#F0E7D8", // 브라운 틴트 배경
        },
        sepia: "#8A6F58",
        accent: "#B5502F", // 은은한 주홍 — 강조에만 아주 조금
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Nanum Myeongjo", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        prose: "43rem", // ~688px, 책처럼 읽기 좋은 한 줄 길이
      },
      lineHeight: {
        story: "2.0",
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "0.9rem",
      },
      boxShadow: {
        // 아주 옅은 그림자 (진한 그림자 지양)
        card: "0 1px 3px rgba(58,53,50,0.05), 0 1px 2px rgba(58,53,50,0.04)",
        "card-hover": "0 6px 18px rgba(58,53,50,0.08)",
      },
      transitionDuration: {
        250: "250ms",
      },
    },
  },
  plugins: [],
};

export default config;

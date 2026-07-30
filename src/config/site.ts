/**
 * Global site settings. Change values here to rebrand the whole site.
 */
export const site = {
  name: "명언이야기",
  title: "명언이야기",
  tagline: "명언 한 줄이 전하는 옛날이야기와 오늘의 교훈",
  description:
    "명언 하나를 눈물 나는 옛날이야기로 풀어내고 따뜻한 교훈으로 마무리합니다. 인생·위로·용기·그리움 등 주제별 명언 이야기.",
  // Read at build/runtime from env; falls back to localhost for dev.
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  ),
  locale: "ko_KR",
  author: "명언이야기",
  organization: {
    name: "명언이야기",
    logo: "/logo.png",
  },
  // Coupang Partners disclosure shown under any Coupang banner.
  coupangDisclosure:
    "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.",
};

export type Site = typeof site;

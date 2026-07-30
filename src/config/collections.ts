/**
 * Situational "hub" collections — landing pages built around how people actually
 * search ("삶이 힘들 때", "이별 후 위로가 되는 글"). Each hub gathers stories by
 * category and/or tag, targets long-tail keywords, and cross-links to the others
 * — good for long-tail SEO and internal linking. Slugs are ASCII (URLs work).
 *
 * Add a hub by adding an entry here (it auto-appears on the home hub row, the
 * /read/[slug] route, and the sitemap).
 */
export type Collection = {
  slug: string;
  /** H1 / title — phrased as a search query. */
  title: string;
  /** One-line intro shown under the H1. */
  lead: string;
  /** Long-tail search phrases for the meta description/keywords. */
  keywords: string[];
  /** Include stories in any of these categories… */
  categories?: string[];
  /** …or carrying any of these tags. */
  tags?: string[];
};

export const collections: Collection[] = [
  {
    slug: "when-life-is-hard",
    title: "삶이 힘들 때 읽는 글",
    lead: "사는 게 유난히 버거운 날, 마음을 조용히 다독여 줄 이야기들을 모았습니다.",
    keywords: ["삶이 힘들 때", "삶이 힘들 때 읽는 글", "마음이 힘들 때", "지쳤을 때 읽는 글", "위로가 되는 글"],
    categories: ["comfort", "life", "courage"],
  },
  {
    slug: "words-of-comfort",
    title: "위로가 되는 글 모음",
    lead: "지친 하루 끝, 곁에 조용히 있어 줄 위로의 이야기들입니다.",
    keywords: ["위로가 되는 글", "위로가 필요할 때", "마음이 힘들 때", "위로글 모음"],
    categories: ["comfort"],
    tags: ["위로", "위로가 되는 글"],
  },
  {
    slug: "after-breakup",
    title: "이별 후 위로가 되는 글",
    lead: "떠나보낸 사람이 자꾸 떠오르는 밤, 그 마음을 가만히 어루만지는 이야기들.",
    keywords: ["이별했을 때", "이별 후 위로가 되는 글", "그리운 사람이 있을 때", "보고 싶을 때"],
    categories: ["longing"],
    tags: ["이별", "그리움", "이별했을 때"],
  },
  {
    slug: "tired-of-relationships",
    title: "인간관계에 지쳤을 때 읽는 글",
    lead: "사람 때문에 마음이 자주 상하는 당신에게 건네는 이야기들.",
    keywords: ["인간관계에 지쳤을 때", "사람에게 상처받았을 때", "무례한 사람 대처", "곁에 두면 안 되는 사람"],
    categories: ["relationship"],
    tags: ["인간관계", "인간관계에 지쳤을 때", "사람에게 상처받았을 때"],
  },
  {
    slug: "missing-someone",
    title: "그리운 사람이 생각날 때",
    lead: "보고 싶어도 볼 수 없는 사람을 향한 마음을 담은 이야기들.",
    keywords: ["그리운 사람이 있을 때", "부모님 생각날 때", "보고 싶을 때", "그리울 때 읽는 글"],
    categories: ["longing", "family"],
  },
  {
    slug: "need-courage",
    title: "용기가 필요할 때 읽는 글",
    lead: "한 걸음 내딛기가 두려운 날, 등을 살며시 밀어 줄 이야기들.",
    keywords: ["용기가 필요할 때", "다시 시작하고 싶을 때", "포기하고 싶을 때", "도전이 두려울 때"],
    categories: ["courage", "challenge", "hope", "effort"],
  },
];

export function getCollection(slug: string): Collection | undefined {
  return collections.find((c) => c.slug === slug);
}

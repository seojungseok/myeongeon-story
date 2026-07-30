/**
 * Category list — the single source of truth.
 * To add a category later, just add an entry here. Slugs are used in URLs
 * (/category/[slug]); labels are shown in Korean.
 *
 * A story's `category` field should match one of these `slug` values.
 */
export type Category = {
  slug: string;
  label: string;
  /** Short blurb used in category page meta descriptions. */
  blurb: string;
};

export const categories: Category[] = [
  { slug: "life", label: "인생", blurb: "인생의 의미를 되새기는" },
  { slug: "comfort", label: "위로", blurb: "지친 마음을 다독이는" },
  { slug: "courage", label: "용기", blurb: "다시 일어설 힘을 주는" },
  { slug: "relationship", label: "인연", blurb: "사람과 사람 사이의" },
  { slug: "longing", label: "그리움", blurb: "보고 싶은 마음을 담은" },
  { slug: "success", label: "성공", blurb: "꿈을 이루는 길에 관한" },
  { slug: "effort", label: "노력", blurb: "묵묵히 나아가는 힘에 관한" },
  { slug: "love", label: "사랑", blurb: "가슴 따뜻한 사랑에 관한" },
  { slug: "friend", label: "친구", blurb: "오랜 벗과 우정에 관한" },
  { slug: "happiness", label: "행복", blurb: "작은 행복을 발견하는" },
  { slug: "challenge", label: "도전", blurb: "두려움을 넘어서는" },
  { slug: "study", label: "공부", blurb: "배움과 성장에 관한" },
  { slug: "time", label: "시간", blurb: "흘러가는 시간에 관한" },
  { slug: "family", label: "가족", blurb: "가족의 사랑에 관한" },
  { slug: "hope", label: "희망", blurb: "내일을 밝히는 희망에 관한" },
];

const bySlug = new Map(categories.map((c) => [c.slug, c]));
const byLabel = new Map(categories.map((c) => [c.label, c]));

/** Look up a category by slug OR Korean label (data files may use either). */
export function getCategory(key: string): Category | undefined {
  return bySlug.get(key) || byLabel.get(key);
}

export function categoryLabel(key: string): string {
  return getCategory(key)?.label ?? key;
}

export function categorySlug(key: string): string {
  return getCategory(key)?.slug ?? key;
}

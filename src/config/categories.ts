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
  /** Situational/emotional search phrase woven into title/description for SEO. */
  search: string;
};

export const categories: Category[] = [
  { slug: "life", label: "인생", blurb: "인생의 의미를 되새기는", search: "삶이 힘들 때, 인생이 허무할 때 읽는" },
  { slug: "comfort", label: "위로", blurb: "지친 마음을 다독이는", search: "마음이 힘들 때, 위로가 필요할 때 위로가 되는" },
  { slug: "courage", label: "용기", blurb: "다시 일어설 힘을 주는", search: "용기가 필요할 때, 다시 시작하고 싶을 때 읽는" },
  { slug: "relationship", label: "인연", blurb: "사람과 사람 사이의", search: "인간관계에 지쳤을 때, 사람에게 상처받았을 때 읽는" },
  { slug: "longing", label: "그리움", blurb: "보고 싶은 마음을 담은", search: "그리운 사람이 있을 때, 이별했을 때 읽는" },
  { slug: "success", label: "성공", blurb: "꿈을 이루는 길에 관한", search: "성공하고 싶을 때, 목표가 흔들릴 때 읽는" },
  { slug: "effort", label: "노력", blurb: "묵묵히 나아가는 힘에 관한", search: "포기하고 싶을 때, 노력해도 안 될 때 읽는" },
  { slug: "love", label: "사랑", blurb: "가슴 따뜻한 사랑에 관한", search: "사랑이 힘들 때 읽는" },
  { slug: "friend", label: "친구", blurb: "오랜 벗과 우정에 관한", search: "외로울 때, 진짜 친구가 그리울 때 읽는" },
  { slug: "happiness", label: "행복", blurb: "작은 행복을 발견하는", search: "행복해지고 싶을 때, 작은 행복을 찾고 싶을 때 읽는" },
  { slug: "challenge", label: "도전", blurb: "두려움을 넘어서는", search: "도전이 두려울 때, 새로 시작하고 싶을 때 읽는" },
  { slug: "study", label: "공부", blurb: "배움과 성장에 관한", search: "배움이 필요할 때, 마음을 다잡고 싶을 때 읽는" },
  { slug: "time", label: "시간", blurb: "흘러가는 시간에 관한", search: "세월이 빠르게 느껴질 때 읽는" },
  { slug: "family", label: "가족", blurb: "가족의 사랑에 관한", search: "부모님 생각날 때, 가족이 소중할 때 읽는" },
  { slug: "hope", label: "희망", blurb: "내일을 밝히는 희망에 관한", search: "지치고 힘들 때, 희망이 필요할 때 읽는" },
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

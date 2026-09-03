/**
 * The canonical Story shape. Whether a story comes from JSON or Markdown,
 * the content loader normalizes it into this type.
 */
export type RelatedQuote = {
  text: string;
  author: string;
  /** Optional slug of another story to deep-link to (internal linking). */
  storyId?: string;
};

export type Story = {
  /** Unique id / slug used in the URL (/story/[id]). */
  id: string;
  /** Category slug OR Korean label (loader normalizes to slug). */
  category: string;
  tags: string[];
  title: string;
  quote: string;
  quoteAuthor: string;
  story: string;
  lesson: string;
  todayAction: string;
  relatedQuotes: RelatedQuote[];
  /** English keyword used by scripts/cache-images.ts to fetch a Pexels photo. */
  photoKeyword: string;
  /** Popularity weight — fakes "most read" without a DB. Higher = more popular. */
  viewWeight: number;
  /** Coupang product URL. Empty string when none. */
  coupangUrl: string;
  /** ISO date string, e.g. "2026-07-30". */
  createdAt: string;
  /** Optional YouTube video id of a category-matching song (see fetch-youtube). */
  youtubeId?: string;
  /** SEO description; auto-derived from story if absent. */
  description?: string;
  /**
   * Cached local image path (set by cache-images script), e.g.
   * "/images/pexels/effort.jpg". Falls back to a gradient if missing.
   */
  image?: string;
  /** Optional second image shown inside the story body. */
  bodyImage?: string;
  /** Source format, for debugging. */
  _source?: "json" | "markdown";
};

/** A lightweight card projection used in list views. */
export type StoryCardData = Pick<
  Story,
  "id" | "category" | "title" | "quote" | "quoteAuthor" | "tags" | "image" | "createdAt"
>;

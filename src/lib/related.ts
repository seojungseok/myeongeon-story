import { getAllStories } from "./content";
import type { Story } from "./types";

/**
 * Related-story recommendation, in priority order:
 *   1. Tag similarity (number of shared tags)
 *   2. Same category
 *   3. Random fill
 *
 * Deterministic given the same content set, so pages stay static.
 */
export function getRelatedStories(story: Story, limit = 5): Story[] {
  const others = getAllStories().filter((s) => s.id !== story.id);
  const tagSet = new Set(story.tags.map((t) => t.toLowerCase()));

  const scored = others.map((s) => {
    const shared = s.tags.filter((t) => tagSet.has(t.toLowerCase())).length;
    const sameCat = s.category === story.category ? 1 : 0;
    // Tag overlap dominates; category is a tiebreaker; viewWeight breaks further ties.
    const score = shared * 100 + sameCat * 10 + Math.min(s.viewWeight, 9) * 0.1;
    return { s, score, shared, sameCat };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Stable, deterministic fallback ordering.
    return a.s.id.localeCompare(b.s.id);
  });

  const picked = scored.slice(0, limit).map((x) => x.s);

  // If we somehow have fewer than `limit` (tiny content set), that's fine.
  return picked;
}

/**
 * Estimate reading time from the story text. Korean adults read roughly
 * 500–600 characters per minute; we use a gentle 500 cpm and round up,
 * with a minimum of 1 minute.
 */
export function readingMinutes(text: string): number {
  const chars = (text || "").replace(/\s/g, "").length;
  return Math.max(1, Math.round(chars / 500));
}

export function readingTimeLabel(text: string): string {
  return `약 ${readingMinutes(text)}분`;
}

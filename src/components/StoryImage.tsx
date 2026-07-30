import Image from "next/image";
import type { Story } from "@/lib/types";

/**
 * Displays a story's locally-cached Pexels image. If the image wasn't cached
 * (e.g. before running the cache script), falls back to a warm gradient so the
 * layout never breaks.
 */
export function StoryImage({
  story,
  className = "",
  priority = false,
  sizes = "100vw",
}: {
  story: Pick<Story, "image" | "title" | "photoKeyword">;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  if (!story.image) {
    return (
      <div
        className={`bg-gradient-to-br from-brand-tint via-paper to-accent/20 ${className}`}
        aria-hidden
      />
    );
  }
  return (
    <Image
      src={story.image}
      alt={story.title}
      fill
      sizes={sizes}
      priority={priority}
      className={`object-cover ${className}`}
      // If the local file is missing at runtime, hide broken-image icon.
      style={{ objectFit: "cover" }}
    />
  );
}

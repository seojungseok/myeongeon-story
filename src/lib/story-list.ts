import type { Story } from "./types";

/**
 * The slim shape a compact list row needs. Kept in a server-safe module (not in
 * the "use client" StoryList component) so Server Components can call the mapper
 * below — non-component exports from a client module aren't real functions on
 * the server.
 */
export type StoryListItem = Pick<
  Story,
  "id" | "title" | "quote" | "category" | "createdAt"
> & {
  image?: string;
  photoKeyword?: string;
};

/** Slim a full Story down to just what the list row needs (keeps payload small). */
export function toListItems(stories: Story[]): StoryListItem[] {
  return stories.map((s) => ({
    id: s.id,
    title: s.title,
    quote: s.quote,
    category: s.category,
    createdAt: s.createdAt,
    image: s.image,
    photoKeyword: s.photoKeyword,
  }));
}

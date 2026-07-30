import { marked } from "marked";

/**
 * Renders the story body.
 * - Markdown-sourced stories may contain markdown (bold, etc.) → render as HTML.
 * - JSON stories are plain text with paragraphs separated by blank lines.
 * We treat both uniformly: run through `marked`, which leaves plain paragraphs
 * intact and converts any markdown niceties.
 */
export function StoryBody({ text }: { text: string }) {
  const html = marked.parse(text, { async: false, breaks: true }) as string;
  return (
    <div
      className="story-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

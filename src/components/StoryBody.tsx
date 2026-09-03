import { marked } from "marked";
import Image from "next/image";
import { Fragment } from "react";

/**
 * Renders the story body.
 * - Markdown-sourced stories may contain markdown (bold, etc.) → render as HTML.
 * - JSON stories are plain text with paragraphs separated by blank lines.
 * We treat both uniformly: run through `marked`, which leaves plain paragraphs
 * intact and converts any markdown niceties.
 */
export function StoryBody({
  text,
  image,
  title,
}: {
  text: string;
  image?: string;
  title?: string;
}) {
  const blocks = text
    .split(/\n{2,}/)
    .map((x) => x.trim())
    .filter(Boolean);
  const insertAt = Math.max(1, Math.ceil(blocks.length / 2));

  if (blocks.length === 0) return null;

  const renderBlock = (block: string, key: string) => {
    const html = marked.parse(block, { async: false, breaks: true }) as string;
    return <div key={key} dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div className="story-body">
      {blocks.map((block, i) => (
        <Fragment key={`story-block-${i}`}>
          {renderBlock(block, `body-${i}`)}
          {image && i + 1 === insertAt && (
            <figure
              className="my-10 overflow-hidden rounded-2xl border border-line bg-paper-deep"
            >
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src={image}
                  alt={title ? `${title} 관련 이미지` : "명언 이야기 관련 이미지"}
                  fill
                  sizes="(max-width: 768px) 100vw, 688px"
                  className="object-cover"
                />
              </div>
            </figure>
          )}
        </Fragment>
      ))}
    </div>
  );
}

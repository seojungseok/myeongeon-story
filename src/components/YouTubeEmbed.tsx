/**
 * YouTube song player for a story. Rendered near the TOP of the detail page
 * (below the title, above the body) so a visitor can press play and keep
 * reading while it plays.
 *
 * - No surrounding text — just the player.
 * - No autoplay (browsers block it anyway; visitor presses play).
 * - This is a server component rendering a plain static <iframe>, so scrolling
 *   never unmounts/remounts it — the song keeps playing as you scroll.
 * - youtube-nocookie for privacy.
 */
export function YouTubeEmbed({
  id,
  title,
}: {
  id: string;
  title?: string;
}) {
  if (!id) return null;
  const src = `https://www.youtube-nocookie.com/embed/${id}?rel=0`;

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl border border-line bg-paper-deep">
      <iframe
        className="absolute inset-0 h-full w-full"
        src={src}
        title={title || "노래"}
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}

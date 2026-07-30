/**
 * YouTube song embed for a story. Rendered on the detail page only when the
 * story has a `youtubeId` (auto-assigned by scripts/fetch-youtube.ts).
 *
 * IMPORTANT: no autoplay. The URL has no `autoplay=1` and the `allow` attribute
 * intentionally omits "autoplay", so the visitor must press play themselves.
 * Uses the privacy-enhanced youtube-nocookie domain.
 */
export function YouTubeEmbed({
  id,
  title,
}: {
  id: string;
  title?: string;
}) {
  if (!id) return null;
  // rel=0 keeps related videos to the same channel; no autoplay param.
  const src = `https://www.youtube-nocookie.com/embed/${id}?rel=0`;

  return (
    <section className="mt-12">
      <p className="highlight-label">
        <span aria-hidden>🎵</span> 이 이야기와 어울리는 노래
      </p>
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-line bg-paper-deep">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={src}
          title={title || "관련 노래"}
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
      <p className="mt-2 font-sans text-xs text-subtle">
        재생 버튼을 누르면 노래가 시작됩니다. (자동재생 아님)
      </p>
    </section>
  );
}

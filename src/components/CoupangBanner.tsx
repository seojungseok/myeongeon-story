import { site } from "@/config/site";

/**
 * Coupang product banner. Rendered only when a story has a coupangUrl.
 * The Partners disclosure is always shown beneath it (legal requirement).
 */
export function CoupangBanner({ url }: { url: string }) {
  if (!url) return null;
  return (
    <aside className="rounded-2xl border border-brand-soft/50 bg-brand-tint px-5 py-5">
      <a
        href={url}
        target="_blank"
        rel="nofollow sponsored noopener noreferrer"
        className="btn w-full sm:w-auto"
      >
        🛍️ 이 이야기와 어울리는 상품 보러 가기
      </a>
      <p className="mt-3 text-xs leading-relaxed text-subtle">
        {site.coupangDisclosure}
      </p>
    </aside>
  );
}

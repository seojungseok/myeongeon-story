import Link from "next/link";
import { categories } from "@/config/categories";

/**
 * Collapsed topic chooser. It keeps category links available for readers and
 * crawlers, but avoids a noisy row of pills at the top of list pages.
 */
export function CategoryBar({ active }: { active?: string }) {
  return (
    <details id="categories" className="group rounded-2xl border border-line bg-paper-deep/70">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-sans">
        <span>
          <span className="block text-sm font-semibold text-ink">다양한 주제의 명언 보기</span>
          <span className="block text-xs text-subtle">인생, 위로, 용기, 가족처럼 필요한 마음을 골라 읽어보세요.</span>
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-paper transition group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="grid gap-2 border-t border-line px-5 py-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => {
          const isActive = active === c.slug;
          return (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className={`rounded-xl border px-4 py-3 font-sans transition ${
                isActive
                  ? "border-brand bg-brand text-paper"
                  : "border-line bg-white text-ink hover:border-brand-soft hover:bg-paper"
              }`}
            >
              <span className="block font-semibold">{c.label} 명언</span>
              <span className={`mt-1 block text-sm leading-snug ${isActive ? "text-paper/80" : "text-subtle"}`}>
                {c.search} 글
              </span>
            </Link>
          );
        })}
      </div>
    </details>
  );
}

import Link from "next/link";
import { categories } from "@/config/categories";

/**
 * Horizontal, swipeable category pill bar — sits right under the header.
 * On mobile it slides left/right; driven by src/config/categories.ts.
 */
export function CategoryBar({ active }: { active?: string }) {
  return (
    <nav
      aria-label="주제별 카테고리"
      className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 py-1"
    >
      {categories.map((c) => {
        const isActive = active === c.slug;
        return (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 font-sans text-sm font-medium transition duration-250 ${
              isActive
                ? "border-brand bg-brand text-paper"
                : "border-line bg-brand-tint text-brand hover:border-brand-soft hover:bg-brand hover:text-paper"
            }`}
          >
            {c.label}
          </Link>
        );
      })}
    </nav>
  );
}

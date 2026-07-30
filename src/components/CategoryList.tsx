import Link from "next/link";
import { categories } from "@/config/categories";

/**
 * Category buttons. Driven entirely by src/config/categories.ts, so adding a
 * category there makes it appear here (and everywhere) automatically.
 */
export function CategoryList({ active }: { active?: string }) {
  return (
    <div id="categories" className="flex flex-wrap gap-2.5">
      {categories.map((c) => {
        const isActive = active === c.slug;
        return (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className={`rounded-full border px-4 py-2 font-sans text-[0.95rem] font-medium transition duration-250 ${
              isActive
                ? "border-brand bg-brand text-paper"
                : "border-line bg-brand-tint text-brand hover:border-brand-soft hover:bg-brand hover:text-paper"
            }`}
          >
            {c.label}
          </Link>
        );
      })}
    </div>
  );
}

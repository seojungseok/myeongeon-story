import { AdSenseUnit } from "./AdSenseUnit";

/**
 * Ad placeholder for the 5 story-page positions (①–⑤).
 *
 * Render priority:
 *   1) `children` passed in            → render that markup (custom per-slot code).
 *   2) NEXT_PUBLIC_ADSENSE_CLIENT set  → render a real AdSense unit.
 *   3) NEXT_PUBLIC_AD_PREVIEW=="true"  → render a gray placeholder (position check).
 *   4) otherwise                       → render NOTHING (no text, no empty box).
 *
 * So by default (no ad code, preview off) visitors see nothing at all — the old
 * "광고 자리 ①" dev text never reaches real users. Turn on the placeholder only
 * when you explicitly want to check layout:  NEXT_PUBLIC_AD_PREVIEW=true
 */

// Read at build time; NEXT_PUBLIC_* are inlined so this stays a Server Component.
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";
const AD_PREVIEW = process.env.NEXT_PUBLIC_AD_PREVIEW === "true";

export function AdSlot({
  id,
  slot,
  children,
  className = "",
}: {
  /** Position label, e.g. "①". Used for per-slot targeting/debugging. */
  id: string;
  /** AdSense data-ad-slot (numeric) for this position, once you have it. */
  slot?: string;
  /** Optional custom ad markup for this position. */
  children?: React.ReactNode;
  className?: string;
}) {
  // 1) Explicit markup wins.
  if (children) {
    return (
      <div className={`ad-slot my-8 ${className}`} data-ad-slot={id}>
        {children}
      </div>
    );
  }

  // 2) AdSense configured via env → real ad unit.
  if (ADSENSE_CLIENT) {
    return (
      <div className={`ad-slot my-8 ${className}`} data-ad-slot={id}>
        <AdSenseUnit client={ADSENSE_CLIENT} slot={slot} />
      </div>
    );
  }

  // 3) Opt-in position preview (dev or anywhere) — never on by default.
  if (AD_PREVIEW) {
    return (
      <div className={`my-6 ${className}`} data-ad-slot={id} aria-hidden>
        <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-line font-sans text-xs text-subtle">
          광고 자리 {id}
        </div>
      </div>
    );
  }

  // 4) No code, no preview → render nothing (and take up no space).
  return null;
}

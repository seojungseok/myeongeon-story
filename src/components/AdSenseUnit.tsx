"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * A single Google AdSense display unit. Rendered by AdSlot only when
 * NEXT_PUBLIC_ADSENSE_CLIENT is set. The loader script itself is added once in
 * layout.tsx (also guarded by that env var).
 *
 * `slot` is the numeric data-ad-slot from your AdSense ad unit. If you use
 * AdSense "Auto ads" (page-level), you can leave slot empty and rely on the
 * page-level script instead.
 */
export function AdSenseUnit({
  client,
  slot,
}: {
  client: string;
  slot?: string;
}) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* AdSense not ready / blocked — ignore */
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}

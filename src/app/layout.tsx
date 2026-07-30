import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Nanum_Myeongjo, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { site } from "@/config/site";
import { JsonLd } from "@/components/JsonLd";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";

// AdSense loader is added only when a client id is configured, so the site ships
// with zero ad scripts until you're approved and set the env var.
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";

// Serif (명조) — story body, titles, quotes, logo. Big, warm, readable.
const serif = Nanum_Myeongjo({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  variable: "--font-serif",
  display: "swap",
});

// Sans (고딕) — UI: buttons, menu, meta, tags.
const sans = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} - ${site.tagline}`,
    template: `%s`,
  },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: site.locale,
    url: site.url,
    title: `${site.name} - ${site.tagline}`,
    description: site.description,
  },
  robots: { index: true, follow: true },
  alternates: {
    canonical: site.url,
    types: { "application/rss+xml": `${site.url}/rss.xml` },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${serif.variable} ${sans.variable}`}>
      <body>
        {ADSENSE_CLIENT && (
          <Script
            id="adsbygoogle-loader"
            async
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
          />
        )}
        <JsonLd data={[websiteJsonLd(), organizationJsonLd()]} />
        <SiteHeader />
        <main className="pb-24 pt-8">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur">
      <div className="container-wide flex items-center justify-between py-3.5">
        <Link
          href="/"
          className="font-serif text-2xl font-extrabold tracking-tight text-brand"
        >
          {site.name}
        </Link>
        <nav className="flex items-center gap-5 font-sans text-sm text-subtle">
          <Link href="/#categories" className="transition-colors hover:text-brand">
            주제별
          </Link>
          <Link href="/bookmarks" className="transition-colors hover:text-brand">
            즐겨찾기
          </Link>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper-deep/60">
      <div className="container-wide flex flex-col gap-2 py-10 font-sans text-sm text-subtle">
        <p className="font-serif text-lg font-bold text-brand">{site.name}</p>
        <p>{site.tagline}</p>
        <p className="mt-2 text-xs leading-relaxed">
          © {new Date().getFullYear()} {site.name}. 모든 이야기는 마음을 위한
          창작·재구성이며, 명언 출처가 분명하지 않은 경우 &lsquo;작자 미상&rsquo;으로
          표기합니다.
        </p>
      </div>
    </footer>
  );
}

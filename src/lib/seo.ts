import type { Metadata } from "next";
import { site } from "@/config/site";
import { categoryLabel } from "@/config/categories";
import type { Story } from "./types";

export function absUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${site.url}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Build Metadata for a story detail page. */
export function storyMetadata(story: Story): Metadata {
  const title = `${story.title} - ${site.name}`;
  const description = story.description || story.quote;
  const url = absUrl(`/story/${story.id}`);
  const ogImage = absUrl(`/story/${story.id}/opengraph-image`);

  return {
    title,
    description,
    keywords: [...story.tags, categoryLabel(story.category), "명언", "명언 이야기"],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      siteName: site.name,
      locale: site.locale,
      images: [{ url: ogImage, width: 1200, height: 630, alt: story.title }],
      publishedTime: story.createdAt,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

/** Build Metadata for list-type pages (category/tag/search). */
export function listMetadata(opts: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const title = `${opts.title} - ${site.name}`;
  const url = absUrl(opts.path);
  return {
    title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description: opts.description,
      url,
      siteName: site.name,
      locale: site.locale,
    },
    twitter: { card: "summary", title, description: opts.description },
  };
}

// ---- JSON-LD builders ------------------------------------------------------

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
    description: site.description,
    potentialAction: {
      "@type": "SearchAction",
      target: `${site.url}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.organization.name,
    url: site.url,
    logo: absUrl(site.organization.logo),
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absUrl(it.url),
    })),
  };
}

/**
 * Quotation structured data — fits a quote-centric site and can earn richer
 * treatment for the famous-figure quotes we now lead with. `creator` is only
 * set when we actually know the author (not 작자 미상).
 */
export function quotationJsonLd(story: Story) {
  const known = story.quoteAuthor && story.quoteAuthor !== "작자 미상";
  return {
    "@context": "https://schema.org",
    "@type": "Quotation",
    text: story.quote,
    ...(known ? { creator: { "@type": "Person", name: story.quoteAuthor } } : {}),
    isPartOf: absUrl(`/story/${story.id}`),
    inLanguage: "ko",
  };
}

export function articleJsonLd(story: Story) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: story.title,
    description: story.description || story.quote,
    image: [absUrl(`/story/${story.id}/opengraph-image`)],
    datePublished: story.createdAt,
    dateModified: story.createdAt,
    author: { "@type": "Organization", name: site.author },
    publisher: {
      "@type": "Organization",
      name: site.organization.name,
      logo: { "@type": "ImageObject", url: absUrl(site.organization.logo) },
    },
    mainEntityOfPage: absUrl(`/story/${story.id}`),
    articleSection: categoryLabel(story.category),
    keywords: story.tags.join(", "),
  };
}

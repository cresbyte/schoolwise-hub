/**
 * SEO head helpers for public website routes.
 * @module website/seo
 */
import { DEFAULT_KEYWORDS, SCHOOL } from "./constants";

/** Options for generating page metadata. */
export interface WebsiteHeadOptions {
  title: string;
  description: string;
  keywords?: string[];
}

/**
 * Builds TanStack Router head config for a website page.
 * @param options - Page title (without suffix), description, optional keywords
 */
export function websiteHead({ title, description, keywords }: WebsiteHeadOptions) {
  const fullTitle = `${title} | ${SCHOOL.name}`;
  const kw = (keywords ?? DEFAULT_KEYWORDS).join(", ");
  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: description },
      { name: "keywords", content: kw },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description },
      { property: "og:image", content: SCHOOL.ogImage },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: fullTitle },
      { name: "twitter:description", content: description },
    ],
  };
}

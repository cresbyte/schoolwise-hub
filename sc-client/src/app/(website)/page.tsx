/**
 * Primrose Private Academy — public homepage.
 * Assembled from modular section components, config-driven, Kabarak-style.
 * @module website/page
 */
import type { Metadata } from "next";
import { getHeroSlides, getSchoolStats, getWhyChooseUs, getNewsArticles, getUpcomingEvents, getDownloadItems } from "@/lib/website/data";
import { WEBSITE_IMAGES, SCHOOL, DEFAULT_KEYWORDS } from "@/lib/website/constants";
import { Hero } from "@/components/website/sections/Hero";
import { StatsBand } from "@/components/website/sections/StatsBand";
import { QuickLinks } from "@/components/website/sections/QuickLinks";
import { MissionBand } from "@/components/website/sections/MissionBand";
import { HighlightGrid } from "@/components/website/sections/HighlightGrid";
import { NewsGrid } from "@/components/website/sections/NewsGrid";
import { NoticeBoard } from "@/components/website/sections/NoticeBoard";

export const metadata: Metadata = {
  title: `${SCHOOL.name} — ${SCHOOL.motto}`,
  description: `${SCHOOL.name} is a leading CBC and 8-4-4 school in ${SCHOOL.location}. Offering PP1 to Form 4, boarding excellence and holistic education since ${SCHOOL.founded}.`,
  keywords: DEFAULT_KEYWORDS.join(", "),
  openGraph: {
    title: SCHOOL.name,
    description: SCHOOL.tagline,
    images: [SCHOOL.ogImage],
  },
};

export default function HomePage() {
  const slides = getHeroSlides();
  const stats = getSchoolStats();
  const highlights = getWhyChooseUs();
  const articles = getNewsArticles();
  const events = getUpcomingEvents();
  const downloads = getDownloadItems();

  return (
    <>
      {/* 1. Hero carousel */}
      <Hero slides={slides} />

      {/* 2. Quick-access portal tiles */}
      <QuickLinks />

      {/* 3. Stats counter band */}
      <StatsBand stats={stats} />

      {/* 4. Mission / Principal's message */}
      <MissionBand image={WEBSITE_IMAGES.principal} />

      {/* 5. Why Choose Us highlights */}
      <HighlightGrid items={highlights} />

      {/* 6. News & Events grid */}
      <NewsGrid articles={articles} limit={5} />

      {/* 7. Notice board — events + downloads */}
      <NoticeBoard events={events} downloads={downloads} />
    </>
  );
}

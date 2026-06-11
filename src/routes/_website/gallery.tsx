/**
 * Photo gallery page with filters and lightbox.
 * @module routes/_website/gallery
 */
import { createFileRoute } from "@tanstack/react-router";
import { PageBanner } from "@/components/website/PageBanner";
import { SectionWrapper } from "@/components/website/SectionWrapper";
import { SectionHeading } from "@/components/website/SectionHeading";
import { GalleryGrid } from "@/components/website/GalleryGrid";
import { websiteHead } from "@/lib/website/seo";
import { SCHOOL } from "@/lib/website/constants";
import { GALLERY_ITEMS } from "@/lib/website/data";

export const Route = createFileRoute("/_website/gallery")({
  head: () =>
    websiteHead({
      title: "Gallery",
      description: `Photo gallery of ${SCHOOL.name} campus, sports, arts, and events.`,
    }),
  component: GalleryPage,
});

/** Full gallery page with album filters. */
function GalleryPage() {
  return (
    <>
      <PageBanner
        title="Photo Gallery"
        subtitle="Moments from life at Greenfield"
        crumbs={[{ label: "Home", href: "/" }, { label: "Gallery" }]}
      />
      <SectionWrapper>
        <SectionHeading title="Campus & Community" subtitle="Browse photos by album or view all." />
        <GalleryGrid items={GALLERY_ITEMS} />
      </SectionWrapper>
    </>
  );
}

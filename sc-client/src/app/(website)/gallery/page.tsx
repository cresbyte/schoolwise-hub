"use client";

/**
 * Photo gallery page with filters and lightbox.
 * @module website/gallery/page
 */
import { SectionWrapper } from "@/components/website/SectionWrapper";
import { SectionHeading } from "@/components/website/SectionHeading";
import { GalleryGrid } from "@/components/website/GalleryGrid";
import { getGalleryItems } from "@/lib/website/data";

/** Full gallery page with album filters content. */
export default function GalleryPage() {
  return (
    <>
            <SectionWrapper>
        <SectionHeading title="Campus & Community" subtitle="Browse photos by album or view all." />
        <GalleryGrid items={getGalleryItems()} />
      </SectionWrapper>
    </>
  );
}

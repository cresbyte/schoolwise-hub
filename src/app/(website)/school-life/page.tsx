"use client";

/**
 * School Life page — sports, clubs, arts, leadership, boarding.
 * @module website/school-life/page
 */
import { useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { PageBanner } from "@/components/website/PageBanner";
import { SectionWrapper } from "@/components/website/SectionWrapper";
import { ImagePlaceholder } from "@/components/website/ImagePlaceholder";
import { HEADING_FONT, WEBSITE_IMAGES } from "@/lib/website/constants";

const SECTIONS = [
  {
    id: "sports",
    label: "Sports",
    items: ["Football", "Basketball", "Athletics", "Swimming", "Rugby", "Volleyball"],
    desc: "Our sports programme competes at county and national levels. Inter-house competitions foster teamwork and school spirit.",
    image: WEBSITE_IMAGES.sports,
    imageAlt: "Greenfield students competing in inter-house athletics and sports day events",
  },
  {
    id: "clubs",
    label: "Clubs",
    items: ["Debate", "Environmental", "Robotics", "Scouting", "Christian Union", "Journalism"],
    desc: "Over 15 active clubs meet weekly, developing leadership and specialised interests beyond academics.",
    image: WEBSITE_IMAGES.classroom,
    imageAlt: "Students collaborating during an after-school club session",
  },
  {
    id: "arts",
    label: "Arts & Culture",
    items: ["Music", "Drama", "Visual Arts", "Traditional Dance", "Poetry"],
    desc: "Annual music and drama festivals showcase Kenyan cultural heritage alongside contemporary performance.",
    image: WEBSITE_IMAGES.library,
    imageAlt: "Learners exploring creative arts resources in the school library",
  },
  {
    id: "leadership",
    label: "Leadership",
    items: ["Student Council", "Prefects", "Peer Counsellors", "Class Monitors"],
    desc: "Learners develop governance skills through elected student leadership structures at every level.",
    image: WEBSITE_IMAGES.principal,
    imageAlt: "School leadership mentoring student prefects and council members",
  },
];

/** School life page content. */
export default function SchoolLifePage() {
  const [tab, setTab] = useState(0);
  const section = SECTIONS[tab];

  return (
    <>
      <PageBanner
        title="School Life"
        subtitle="Beyond the classroom"
        crumbs={[{ label: "Home", href: "/" }, { label: "School Life" }]}
      />

      <SectionWrapper>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 3 }}
        >
          {SECTIONS.map((s, i) => (
            <Tab
              key={s.id}
              label={s.label}
              value={i}
              sx={{ textTransform: "none", fontWeight: 600 }}
            />
          ))}
          <Tab label="Boarding" value={SECTIONS.length} sx={{ textTransform: "none", fontWeight: 600 }} />
        </Tabs>

        {tab < SECTIONS.length ? (
          <Box id={section.id}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 4,
                alignItems: "center",
              }}
            >
              <Box>
                <Typography variant="h5" sx={{ fontFamily: HEADING_FONT, fontWeight: 700, mb: 2 }}>
                  {section.label}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ lineHeight: 1.8, color: "text.secondary", mb: 3 }}
                >
                  {section.desc}
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {section.items.map((item) => (
                    <Card key={item} variant="outlined" sx={{ px: 2, py: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item}
                      </Typography>
                    </Card>
                  ))}
                </Box>
              </Box>
              <ImagePlaceholder
                src={section.image}
                aspectRatio="4/3"
                alt={section.imageAlt}
              />
            </Box>
          </Box>
        ) : (
          <Box id="boarding">
            <Box
              sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 4 }}
            >
              <ImagePlaceholder
                src={WEBSITE_IMAGES.campusBanner}
                aspectRatio="4/3"
                alt="Greenfield boarding wing and campus accommodation facilities"
              />
              <Box>
                <Typography variant="h5" sx={{ fontFamily: HEADING_FONT, fontWeight: 700, mb: 2 }}>
                  Boarding Life
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ lineHeight: 1.8, color: "text.secondary", mb: 2 }}
                >
                  Our boarding programme serves learners from Grade 4 through Form 4. Separate boys'
                  and girls' dormitories feature study halls, recreation rooms, and 24-hour
                  security.
                </Typography>
                {[
                  "Supervised evening prep (7–9 PM)",
                  "Nutritious meals three times daily",
                  "Weekend outings and devotions",
                  "Qualified matrons and boarding masters",
                  "Laundry and housekeeping services",
                ].map((item) => (
                  <Typography key={item} variant="body2" sx={{ mb: 1 }}>
                    ✓ {item}
                  </Typography>
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </SectionWrapper>
    </>
  );
}

"use client";

/**
 * About Us page — story, vision, leadership, accreditation, facilities.
 * @module website/about/page
 */
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import { PageBanner } from "@/components/website/PageBanner";
import { SectionWrapper } from "@/components/website/SectionWrapper";
import { SectionHeading } from "@/components/website/SectionHeading";
import { ImagePlaceholder } from "@/components/website/ImagePlaceholder";
import { HEADING_FONT, WEBSITE_IMAGES, getSchoolInfo } from "@/lib/website/constants";
import { staff as staffData } from "@/lib/mockData";
import { STAFF_QUALIFICATIONS } from "@/lib/website/data";

const TIMELINE = [
  {
    year: "2008",
    title: "Foundation",
    desc: "Primrose Private Academy established with 45 learners in rented premises along Milimani Road.",
  },
  {
    year: "2012",
    title: "Permanent Campus",
    desc: "Moved to our current 15-acre campus with modern classrooms and sports facilities.",
  },
  {
    year: "2017",
    title: "CBC Pioneer",
    desc: "Among the first private schools in Nakuru to fully implement the Competency-Based Curriculum.",
  },
  {
    year: "2020",
    title: "Boarding Wing",
    desc: "Opened state-of-the-art boarding facilities for learners from across the Rift Valley.",
  },
  {
    year: "2026",
    title: "ShuleSmart Partnership",
    desc: "Integrated digital school management for seamless parent communication and administration.",
  },
];

const VALUES = ["Integrity", "Excellence", "Respect", "Innovation", "Community", "Faith"];

const LEADERS = staffData.filter((s) => ["Principal", "Deputy Principal"].includes(s.designation));

const FACILITIES = [
  {
    title: "Science Laboratories",
    desc: "Fully equipped physics, chemistry, and biology labs for practical learning.",
    image: WEBSITE_IMAGES.classroom,
    imageAlt: "Students conducting a science practical in the laboratory",
  },
  {
    title: "ICT Centre",
    desc: "Computer lab with high-speed internet for digital literacy and research.",
    image: WEBSITE_IMAGES.classroom,
    imageAlt: "Learners using computers in the ICT centre",
  },
  {
    title: "Library",
    desc: "Over 8,000 volumes, study carrels, and e-learning resources.",
    image: WEBSITE_IMAGES.library,
    imageAlt: "Primrose Private Academy library reading area",
  },
  {
    title: "Sports Complex",
    desc: "Football pitch, basketball courts, athletics track, and swimming pool.",
    image: WEBSITE_IMAGES.sports,
    imageAlt: "Students competing during school sports day",
  },
  {
    title: "Boarding Houses",
    desc: "Separate boys' and girls' dormitories with study halls and recreation areas.",
    image: WEBSITE_IMAGES.campusBanner,
    imageAlt: "Primrose campus buildings housing boarding facilities",
  },
  {
    title: "Dining Hall",
    desc: "Nutritious meals prepared daily by qualified catering staff.",
    image: WEBSITE_IMAGES.campusBanner,
    imageAlt: "Primrose campus facilities including the dining hall",
  },
];

/** About Us page with anchor sections. */
export default function AboutPage() {
  const SCHOOL = getSchoolInfo();
  return (
    <>
      <PageBanner
        title="About Us"
        subtitle={SCHOOL.tagline}
        crumbs={[{ label: "Home", href: "/" }, { label: "About Us" }]}
      />

      <SectionWrapper id="story">
        <SectionHeading title="Our Story" align="left" />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 4,
            alignItems: "center",
          }}
        >
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }}>
            Founded in {SCHOOL.founded}, Primrose Private Academy began as a vision to provide
            quality private education accessible to families in Nakuru County. What started as a
            small primary school has grown into a comprehensive institution serving over 680
            learners from PP1 to Form 4.
            <br />
            <br />
            Today, we stand as one of Nakuru's most respected private schools, known for academic
            rigour, character formation, and a warm Kenyan hospitality that makes every learner feel
            at home.
          </Typography>
          <ImagePlaceholder
            src={WEBSITE_IMAGES.campusBanner}
            aspectRatio="4/3"
            alt="Aerial view of the Primrose Private Academy campus in Nakuru"
          />
        </Box>
        <Box sx={{ mt: 5, position: "relative", pl: { md: 4 } }}>
          {TIMELINE.map((item, i) => (
            <Box key={item.year} sx={{ display: "flex", gap: 3, mb: 3, position: "relative" }}>
              <Box sx={{ minWidth: 64, textAlign: "center" }}>
                <Chip label={item.year} color="primary" sx={{ fontWeight: 700 }} />
              </Box>
              <Box
                sx={{
                  flex: 1,
                  pb: 3,
                  borderLeft: i < TIMELINE.length - 1 ? 2 : 0,
                  borderColor: "divider",
                  pl: 3,
                }}
              >
                <Typography variant="h6" sx={{ fontFamily: HEADING_FONT, fontWeight: 700 }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.desc}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </SectionWrapper>

      <SectionWrapper id="vision" alt>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 4 }}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Typography
                variant="h5"
                sx={{ fontFamily: HEADING_FONT, fontWeight: 700, color: "primary.main", mb: 2 }}
              >
                Our Vision
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                To be the leading private school in Nakuru County, producing globally competitive
                citizens rooted in Kenyan values.
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Typography
                variant="h5"
                sx={{ fontFamily: HEADING_FONT, fontWeight: 700, color: "primary.main", mb: 2 }}
              >
                Our Mission
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                To provide holistic, learner-centred education through innovative teaching, strong
                partnerships with families, and a nurturing environment that develops the whole
                child.
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ fontFamily: HEADING_FONT, fontWeight: 700, mb: 2 }}>
            Core Values
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {VALUES.map((v) => (
              <Chip
                key={v}
                label={v}
                color="secondary"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            ))}
          </Box>
        </Box>
      </SectionWrapper>

      <SectionWrapper id="leadership">
        <SectionHeading
          title="School Leadership"
          subtitle="Meet the team guiding Primrose's vision."
        />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
          {LEADERS.map((s) => (
            <Card key={s.id}>
              <CardContent sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Avatar sx={{ width: 72, height: 72, bgcolor: "primary.main", fontSize: 24 }}>
                  {s.firstName[0]}
                  {s.lastName[0]}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {s.firstName} {s.lastName}
                  </Typography>
                  <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                    {s.designation}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(STAFF_QUALIFICATIONS as Record<string, string>)[s.id]}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </SectionWrapper>

      <SectionWrapper id="accreditation" alt>
        <SectionHeading title="Accreditation & Registration" align="left" />
        <Box
          sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 2 }}
        >
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Ministry Registration
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {SCHOOL.name}
              </Typography>
              <Typography variant="body2">P/REG/NAK/2456</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                KNEC Code
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {SCHOOL.knecCode}
              </Typography>
              <Typography variant="body2">Registered examination centre</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                NEMIS Code
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                NAK-30412104
              </Typography>
              <Typography variant="body2">Ministry of Education</Typography>
            </CardContent>
          </Card>
        </Box>
      </SectionWrapper>

      <SectionWrapper id="facilities">
        <SectionHeading
          title="Our Facilities"
          subtitle="A campus designed for learning, growth, and wellbeing."
        />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
            gap: 3,
          }}
        >
          {FACILITIES.map((f) => (
            <Card key={f.title}>
              <ImagePlaceholder
                src={f.image}
                aspectRatio="16/10"
                alt={f.imageAlt}
                borderRadius={0}
              />
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  {f.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {f.desc}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </SectionWrapper>
    </>
  );
}

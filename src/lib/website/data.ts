/**
 * Mock content data for the Greenfield public website.
 * @module website/data
 */
import { WEBSITE_IMAGES } from "./constants";

export interface NewsArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: "News" | "Events" | "Achievements" | "Announcements";
  date: string;
  author: string;
  readMinutes: number;
  image: string;
  content: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  album: "Campus" | "Sports" | "Arts" | "Events" | "Classroom";
  image: string;
  aspect: "landscape" | "portrait" | "square";
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  gradient: string;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface DownloadItem {
  id: string;
  title: string;
  description: string;
  fileType: "PDF" | "DOCX";
  size: string;
}

/** Hero carousel slides for the home page. */
export const HERO_SLIDES = [
  {
    id: "1",
    title: "Welcome to Greenfield Private Academy",
    subtitle: "Excellence Through Knowledge in the heart of Nakuru",
    image: WEBSITE_IMAGES.campusBanner,
    imageAlt: "Greenfield Private Academy campus in Nakuru",
    cta: { label: "Explore Our School", href: "/about" },
  },
  {
    id: "2",
    title: "CBC & 8-4-4 Excellence",
    subtitle: "Holistic education from PP1 through Form 4",
    image: WEBSITE_IMAGES.classroom,
    imageAlt: "Students engaged in classroom learning at Greenfield",
    cta: { label: "View Academics", href: "/academics" },
  },
  {
    id: "3",
    title: "Admissions Open — Term 3, 2026",
    subtitle: "Join a community of learners shaping Kenya's future",
    image: WEBSITE_IMAGES.sports,
    imageAlt: "Students participating in school sports day activities",
    cta: { label: "Apply Now", href: "/admissions/apply" },
  },
] as const;

/** Animated stats for the home page. */
export const SCHOOL_STATS = [
  { label: "Years of Excellence", value: 16, suffix: "+" },
  { label: "Students Enrolled", value: 680, suffix: "+" },
  { label: "Qualified Staff", value: 48, suffix: "" },
  { label: "KCSE Mean Score", value: 8.2, suffix: "", decimals: 1 },
] as const;

/** Why Choose Us feature cards. */
export const WHY_CHOOSE_US = [
  {
    title: "Dual Curriculum",
    description: "Seamless CBC and 8-4-4 pathways with KNEC-aligned assessments.",
    icon: "school",
  },
  {
    title: "Experienced Faculty",
    description: "Dedicated teachers with strong academic and pastoral credentials.",
    icon: "groups",
  },
  {
    title: "Modern Facilities",
    description: "Science labs, ICT centre, library, and sports fields on a serene campus.",
    icon: "apartment",
  },
  {
    title: "Boarding Excellence",
    description: "Safe, structured boarding with supervised study and weekend activities.",
    icon: "hotel",
  },
  {
    title: "Holistic Development",
    description: "Clubs, sports, arts, and leadership programmes beyond the classroom.",
    icon: "emoji_events",
  },
  {
    title: "Parent Partnership",
    description: "Transparent communication via SMS, portal, and regular parent forums.",
    icon: "family_restroom",
  },
] as const;

/** KCSE mean score trend for academics chart. */
export const KCSE_RESULTS = [
  { year: "2019", mean: 7.4 },
  { year: "2020", mean: 7.6 },
  { year: "2021", mean: 7.8 },
  { year: "2022", mean: 8.0 },
  { year: "2023", mean: 8.1 },
  { year: "2026", mean: 8.2 },
];

/** Academic calendar events. */
export const ACADEMIC_CALENDAR = [
  {
    term: "Term 1",
    dates: "8 Jan – 5 Apr 2026",
    events: ["Opening Day", "Mid-Term Break", "End of Term Exams"],
  },
  {
    term: "Term 2",
    dates: "6 May – 9 Aug 2026",
    events: ["Sports Day", "Career Day", "Mock Exams (Form 4)"],
  },
  {
    term: "Term 3",
    dates: "2 Sep – 25 Nov 2026",
    events: ["KCSE Exams", "Grade 6 Assessment", "Prize Giving"],
  },
];

/** Fee structure for admissions page. */
export const FEE_STRUCTURE = {
  day: [
    { grade: "PP1 – PP2", tuition: 28000, activity: 3500, total: 31500 },
    { grade: "Grade 1 – 3", tuition: 32000, activity: 4000, total: 36000 },
    { grade: "Grade 4 – 6", tuition: 36000, activity: 4500, total: 40500 },
    { grade: "Grade 7 – 9", tuition: 42000, activity: 5000, total: 47000 },
    { grade: "Form 1 – 2", tuition: 48000, activity: 5500, total: 53500 },
    { grade: "Form 3 – 4", tuition: 52000, activity: 6000, total: 58000 },
  ],
  boarding: [
    { grade: "Grade 4 – 6", tuition: 72000, activity: 5000, total: 77000 },
    { grade: "Grade 7 – 9", tuition: 78000, activity: 5500, total: 83500 },
    { grade: "Form 1 – 4", tuition: 85000, activity: 6000, total: 91000 },
  ],
};

/** Available admission spaces. */
export const ADMISSION_SPACES = [
  { grade: "PP1", day: 4, boarding: 0 },
  { grade: "PP2", day: 2, boarding: 0 },
  { grade: "Grade 4", day: 6, boarding: 3 },
  { grade: "Grade 6", day: 3, boarding: 2 },
  { grade: "Grade 8", day: 5, boarding: 4 },
  { grade: "Form 1", day: 8, boarding: 6 },
  { grade: "Form 2", day: 4, boarding: 2 },
  { grade: "Form 3", day: 2, boarding: 1 },
];

export const UPCOMING_EVENTS: UpcomingEvent[] = [
  {
    id: "e1",
    title: "Open Day & Campus Tour",
    date: "15 Jul 2026",
    time: "9:00 AM",
    location: "Main Hall",
  },
  {
    id: "e2",
    title: "Inter-House Athletics",
    date: "22 Jul 2026",
    time: "8:00 AM",
    location: "Sports Ground",
  },
  {
    id: "e3",
    title: "Parent-Teacher Conference",
    date: "3 Aug 2026",
    time: "2:00 PM",
    location: "Classrooms",
  },
  {
    id: "e4",
    title: "Music & Drama Festival",
    date: "10 Aug 2026",
    time: "10:00 AM",
    location: "Amphitheatre",
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    name: "Grace Wanjiku",
    role: "Parent, Grade 6",
    quote:
      "Greenfield has transformed my daughter's confidence. The teachers genuinely care about every child.",
    gradient: "linear-gradient(135deg, #1565C0, #42A5F5)",
  },
  {
    id: "t2",
    name: "James Otieno",
    role: "Alumnus, KCSE 2023 — A",
    quote:
      "The discipline and mentorship I received here prepared me for university. I am forever grateful.",
    gradient: "linear-gradient(135deg, #2E7D32, #66BB6A)",
  },
  {
    id: "t3",
    name: "Faith Chemutai",
    role: "Parent, Form 2 Boarder",
    quote:
      "As a working parent in Nairobi, I trust Greenfield's boarding programme completely. Excellent pastoral care.",
    gradient: "linear-gradient(135deg, #F57F17, #FFB74D)",
  },
  {
    id: "t4",
    name: "Peter Kariuki",
    role: "Parent, PP2",
    quote: "The CBC approach is well implemented. My son loves going to school every morning!",
    gradient: "linear-gradient(135deg, #6A1B9A, #AB47BC)",
  },
];

const ARTICLE_BODY = `
Greenfield Private Academy continues to strengthen its position as one of Nakuru County's leading private institutions. Situated along Milimani Road with views of the Rift Valley, our campus provides a nurturing environment where learners from diverse backgrounds thrive academically, socially, and spiritually.

This term, we have invested in upgrading our science laboratories and expanding our digital learning resources. Form 4 candidates are benefiting from intensive revision clinics led by experienced KNEC examiners, while our Junior School learners engage in project-based CBC assessments that develop critical thinking and creativity.

Our boarding section remains a cornerstone of the Greenfield experience. With structured evening prep, supervised recreation, and nutritious meals prepared in our modern kitchen, boarders enjoy a home-away-from-home atmosphere. Day scholars equally benefit from extended library hours and after-school clubs ranging from robotics to debate.

Community engagement remains central to our ethos. Last month, our Environmental Club partnered with Nakuru Municipality on a tree-planting initiative along the Njoro River, reinforcing our commitment to environmental stewardship. The Inter-House Athletics Championships drew families from across the county, showcasing the talent and sportsmanship of our learners.

Parents appreciate our transparent fee policies and convenient M-Pesa payment options. The ShuleSmart parent portal provides real-time access to fee statements, attendance records, and academic reports — keeping families connected to their children's progress.

As we look ahead to Term 3, we invite prospective families to attend our Open Day on 15 July. Tours will include our ICT centre, dormitories, and newly refurbished art studio. Admissions for limited spaces in Form 1 and Grade 4 are now open.

At Greenfield, we believe every child deserves an education that unlocks their full potential. Join us in nurturing tomorrow's leaders today.
`.trim();

function mkArticle(
  slug: string,
  title: string,
  excerpt: string,
  category: NewsArticle["category"],
  date: string,
  image: string,
  author = "Greenfield Communications",
): NewsArticle {
  return {
    slug,
    title,
    excerpt,
    category,
    date,
    author,
    readMinutes: 4,
    image,
    content: ARTICLE_BODY,
  };
}

/** Twelve news articles for listing and detail pages. */
export const NEWS_ARTICLES: NewsArticle[] = [
  mkArticle(
    "greenfield-kcse-2026-results",
    "Greenfield Celebrates Strong KCSE 2026 Performance",
    "Our Form 4 class achieved a mean score of 8.2, with 12 students earning straight A grades.",
    "Achievements",
    "2026-05-20",
    WEBSITE_IMAGES.classroom,
  ),
  mkArticle(
    "open-day-july-2026",
    "Open Day & Campus Tour — 15 July 2026",
    "Prospective families are invited to tour our facilities and meet our leadership team.",
    "Events",
    "2026-06-01",
    WEBSITE_IMAGES.campusBanner,
  ),
  mkArticle(
    "cbc-grade-6-assessment",
    "Grade 6 Learners Excel in National Assessment",
    "Our inaugural CBC cohort demonstrated outstanding performance in the June national assessment.",
    "Achievements",
    "2026-06-05",
    WEBSITE_IMAGES.classroom,
  ),
  mkArticle(
    "new-science-lab",
    "State-of-the-Art Science Lab Officially Opened",
    "The new laboratory will enhance practical learning for Form 3 and Form 4 sciences.",
    "News",
    "2026-05-15",
    WEBSITE_IMAGES.classroom,
  ),
  mkArticle(
    "inter-house-athletics",
    "Inter-House Athletics Championships 2026",
    "Blue House emerged victorious in a thrilling day of track and field events.",
    "Events",
    "2026-05-10",
    WEBSITE_IMAGES.sports,
  ),
  mkArticle(
    "debate-team-nakuru",
    "Debate Team Wins Nakuru County Championship",
    "Greenfield debaters will represent the county at the national finals in Nairobi.",
    "Achievements",
    "2026-04-28",
    WEBSITE_IMAGES.classroom,
  ),
  mkArticle(
    "parent-portal-launch",
    "ShuleSmart Parent Portal Now Live",
    "Parents can now view fees, attendance, and report cards online via the new portal.",
    "Announcements",
    "2026-04-15",
    WEBSITE_IMAGES.library,
  ),
  mkArticle(
    "music-drama-festival",
    "Annual Music & Drama Festival Set for August",
    "Learners are rehearsing for the highly anticipated cultural showcase.",
    "Events",
    "2026-04-01",
    WEBSITE_IMAGES.sports,
  ),
  mkArticle(
    "tree-planting-initiative",
    "Environmental Club Plants 500 Trees",
    "Learners partnered with Nakuru Municipality on a reforestation project.",
    "News",
    "2026-03-20",
    WEBSITE_IMAGES.campusBanner,
  ),
  mkArticle(
    "scholarship-programme-2026",
    "Merit Scholarship Programme Announced",
    "Five full scholarships available for outstanding KCPE candidates joining Form 1.",
    "Announcements",
    "2026-03-10",
    WEBSITE_IMAGES.classroom,
  ),
  mkArticle(
    "staff-development-workshop",
    "Teachers Complete CBC Training Workshop",
    "All Junior School teachers certified in the latest KICD curriculum guidelines.",
    "News",
    "2026-02-28",
    WEBSITE_IMAGES.principal,
  ),
  mkArticle(
    "boarding-facilities-upgrade",
    "Boarding Wing Renovation Complete",
    "Modern dormitories with improved study areas now welcome returning boarders.",
    "News",
    "2026-02-15",
    WEBSITE_IMAGES.campusBanner,
  ),
];

const ALBUM_IMAGES: Record<GalleryItem["album"], string> = {
  Campus: WEBSITE_IMAGES.campusBanner,
  Sports: WEBSITE_IMAGES.sports,
  Arts: WEBSITE_IMAGES.library,
  Events: WEBSITE_IMAGES.sports,
  Classroom: WEBSITE_IMAGES.classroom,
};

const ALBUMS: GalleryItem["album"][] = ["Campus", "Sports", "Arts", "Events", "Classroom"];
const ASPECTS: GalleryItem["aspect"][] = ["landscape", "portrait", "square"];

/** Twenty-four gallery items with album filters. */
export const GALLERY_ITEMS: GalleryItem[] = Array.from({ length: 24 }, (_, i) => {
  const album = ALBUMS[i % ALBUMS.length];
  return {
    id: `g${i + 1}`,
    title: [
      "Morning Assembly",
      "Science Practical",
      "Football Match",
      "Art Exhibition",
      "Library Session",
      "Boarding Dorm",
      "Graduation Day",
      "Chemistry Lab",
    ][i % 8],
    album,
    image: ALBUM_IMAGES[album],
    aspect: ASPECTS[i % ASPECTS.length],
  };
});

/** Parent resources FAQs. */
export const PARENT_FAQS: FaqItem[] = [
  {
    id: "f1",
    question: "How do I access the parent portal?",
    answer:
      "Visit the Parent Portal link on our website or go to /login. Use the credentials provided during admission. Contact the office if you need a password reset.",
  },
  {
    id: "f2",
    question: "What are the school fees payment methods?",
    answer:
      "We accept M-Pesa (Paybill 522533), bank transfer, and cash at the accounts office. Always use your child's admission number as the reference.",
  },
  {
    id: "f3",
    question: "What is the school uniform policy?",
    answer:
      "Full uniform is required Monday–Thursday. PE kit on Wednesdays. Boarders have additional house wear. Uniforms are available at the school shop.",
  },
  {
    id: "f4",
    question: "How do I report my child's absence?",
    answer:
      "Call the class teacher or send an SMS to 0712 345 678 before 8:00 AM. For extended absence, submit a written note to the deputy principal.",
  },
  {
    id: "f5",
    question: "When are parent-teacher conferences held?",
    answer:
      "Formal conferences are held once per term. Informal meetings can be arranged through the class teacher with 48 hours' notice.",
  },
  {
    id: "f6",
    question: "What meals are provided for boarders?",
    answer:
      "Three balanced meals daily plus an evening snack. Special dietary needs can be accommodated with medical documentation.",
  },
  {
    id: "f7",
    question: "How are academic reports shared?",
    answer:
      "End-of-term report cards are issued physically and uploaded to the parent portal. Mid-term progress updates are sent via SMS.",
  },
  {
    id: "f8",
    question: "What transport options are available?",
    answer:
      "School buses serve Nakuru Town, Lanet, and Njoro routes. Route maps and fees are available from the transport coordinator.",
  },
  {
    id: "f9",
    question: "How does the admission process work?",
    answer:
      "Submit an online application, attend an assessment interview, receive an offer letter, and complete enrollment with required documents and fees.",
  },
  {
    id: "f10",
    question: "Are scholarships available?",
    answer:
      "Yes. Merit scholarships are awarded annually to outstanding KCPE candidates. Financial aid applications are reviewed by the bursar's office.",
  },
  {
    id: "f11",
    question: "What extracurricular activities are offered?",
    answer:
      "Sports, music, drama, debate, scouting, environmental club, robotics, and Christian union among others. See our School Life page for details.",
  },
  {
    id: "f12",
    question: "How can I contact the principal?",
    answer:
      "Email principal@greenfieldacademy.ac.ke or call 0712 345 678 ext. 101. Appointments can be scheduled through the school secretary.",
  },
];

/** Downloadable parent resources. */
export const PARENT_DOWNLOADS: DownloadItem[] = [
  {
    id: "d1",
    title: "Parent Handbook 2026",
    description: "Policies, procedures, and important dates.",
    fileType: "PDF",
    size: "2.4 MB",
  },
  {
    id: "d2",
    title: "Fee Structure 2026",
    description: "Day and boarding fees by grade level.",
    fileType: "PDF",
    size: "890 KB",
  },
  {
    id: "d3",
    title: "Uniform Price List",
    description: "Complete uniform and PE kit pricing.",
    fileType: "PDF",
    size: "450 KB",
  },
  {
    id: "d4",
    title: "Medical Form",
    description: "Health information for new admissions.",
    fileType: "PDF",
    size: "320 KB",
  },
  {
    id: "d5",
    title: "Transport Routes Map",
    description: "Bus routes and pickup points.",
    fileType: "PDF",
    size: "1.1 MB",
  },
  {
    id: "d6",
    title: "Portal User Guide",
    description: "Step-by-step ShuleSmart portal instructions.",
    fileType: "PDF",
    size: "1.8 MB",
  },
];

/** Staff qualifications mapping (public-safe fields only). */
export const STAFF_QUALIFICATIONS: Record<string, string> = {
  "stf-1": "M.Ed Educational Leadership, B.Ed Arts",
  "stf-2": "Diploma in Early Childhood Education",
  "stf-3": "B.Ed Science (Mathematics), Dip. ICT",
  "stf-4": "B.Ed Arts (English & Literature)",
  "stf-5": "B.Ed Science (Physics), M.Sc Physics",
  "stf-6": "CPA(K), B.Com Accounting",
  "stf-7": "B.Ed Arts (Social Studies & CRE)",
  "stf-8": "B.Ed Arts (Kiswahili & History)",
  "stf-9": "B.Ed Science (Biology)",
  "stf-10": "Diploma in Early Childhood Education",
  "stf-11": "M.Ed Curriculum Studies, B.Ed Science",
  "stf-12": "B.Ed Arts (CRE & History)",
};

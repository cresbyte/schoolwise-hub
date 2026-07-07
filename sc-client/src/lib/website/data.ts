/**
 * Mutable in-memory content store for the Primrose public website.
 * All arrays are wrapped in module-level variables; call the getter
 * functions so CMS mutations are reflected on the public site.
 * @module website/data
 */
import { WEBSITE_IMAGES } from "./constants";

// ─── Types ────────────────────────────────────────────────────────────────────

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

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  imageAlt: string;
  cta: { label: string; href: string };
}

export interface SchoolStat {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
}

export interface WhyChooseUsItem {
  title: string;
  description: string;
  icon: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  submittedAt: string;
  status: "unread" | "read" | "replied" | "archived";
  repliedAt?: string;
  replyNote?: string;
}

export interface ApplicationSubmission {
  id: string;
  applicationRef: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  gradeApplying: string;
  boardingType: "day" | "boarding";
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  relationship: string;
  prevSchool: string;
  prevClass: string;
  reason: string;
  submittedAt: string;
  status: "pending" | "interview_scheduled" | "offered" | "enrolled" | "rejected" | "withdrawn";
  interviewDate?: string;
  notes?: string;
}

// ─── KCSE & Academic Calendar (static — no CMS management) ────────────────────

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

// ─── Hero Slides ──────────────────────────────────────────────────────────────

let _heroSlides: HeroSlide[] = [
  {
    id: "1",
    title: "Welcome to Primrose Private Academy",
    subtitle: "Excellence Through Knowledge in the heart of Nairobi",
    image: "/hero/image1.webp",
    imageAlt: "Primrose Private Academy campus in Nairobi",
    cta: { label: "Explore Our School", href: "/about" },
  },
  {
    id: "2",
    title: "CBC & 8-4-4 Excellence",
    subtitle: "Holistic education from PP1 through Form 4",
    image:"/hero/image2.webp",
    imageAlt: "Students engaged in classroom learning at Primrose",
    cta: { label: "View Academics", href: "/academics" },
  },
  {
    id: "3",
    title: "Admissions Open — Term 3, 2026",
    subtitle: "Join a community of learners shaping Kenya's future",
    image:"/hero/image3.webp",
    imageAlt: "Students participating in school sports day activities",
    cta: { label: "Apply Now", href: "/admissions/apply" },
  },
];
export const getHeroSlides = (): HeroSlide[] => [..._heroSlides];
export const setHeroSlides = (data: HeroSlide[]) => { _heroSlides = data; };

// ─── School Stats ─────────────────────────────────────────────────────────────

let _schoolStats: SchoolStat[] = [
  { label: "Years of Excellence", value: 16, suffix: "+" },
  { label: "Students Enrolled", value: 680, suffix: "+" },
  { label: "Qualified Staff", value: 48, suffix: "" },
  { label: "KCSE Mean Score", value: 8.2, suffix: "", decimals: 1 },
];
export const getSchoolStats = (): SchoolStat[] => [..._schoolStats];
export const setSchoolStats = (data: SchoolStat[]) => { _schoolStats = data; };

// ─── Why Choose Us ────────────────────────────────────────────────────────────

let _whyChooseUs: WhyChooseUsItem[] = [
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
];
export const getWhyChooseUs = (): WhyChooseUsItem[] => [..._whyChooseUs];
export const setWhyChooseUs = (data: WhyChooseUsItem[]) => { _whyChooseUs = data; };

// ─── News Articles ────────────────────────────────────────────────────────────

const ARTICLE_BODY = `
Primrose Private Academy continues to strengthen its position as one of Nairobi County's leading private institutions. Situated along Milimani Road with views of the Rift Valley, our campus provides a nurturing environment where learners from diverse backgrounds thrive academically, socially, and spiritually.

This term, we have invested in upgrading our science laboratories and expanding our digital learning resources. Form 4 candidates are benefiting from intensive revision clinics led by experienced KNEC examiners, while our Junior School learners engage in project-based CBC assessments that develop critical thinking and creativity.

Our boarding section remains a cornerstone of the Primrose experience. With structured evening prep, supervised recreation, and nutritious meals prepared in our modern kitchen, boarders enjoy a home-away-from-home atmosphere. Day scholars equally benefit from extended library hours and after-school clubs ranging from robotics to debate.

Community engagement remains central to our ethos. Last month, our Environmental Club partnered with Nairobi Municipality on a tree-planting initiative along the Njoro River, reinforcing our commitment to environmental stewardship. The Inter-House Athletics Championships drew families from across the county, showcasing the talent and sportsmanship of our learners.

Parents appreciate our transparent fee policies and convenient M-Pesa payment options. The ShuleSmart parent portal provides real-time access to fee statements, attendance records, and academic reports — keeping families connected to their children's progress.

As we look ahead to Term 3, we invite prospective families to attend our Open Day on 15 July. Tours will include our ICT centre, dormitories, and newly refurbished art studio. Admissions for limited spaces in Form 1 and Grade 4 are now open.

At Primrose, we believe every child deserves an education that unlocks their full potential. Join us in nurturing tomorrow's leaders today.
`.trim();

function mkArticle(
  slug: string,
  title: string,
  excerpt: string,
  category: NewsArticle["category"],
  date: string,
  image: string,
  author = "Primrose Communications",
): NewsArticle {
  return { slug, title, excerpt, category, date, author, readMinutes: 4, image, content: ARTICLE_BODY };
}

let _newsArticles: NewsArticle[] = [
  mkArticle("primrose-kcse-2026-results", "Primrose Celebrates Strong KCSE 2026 Performance", "Our Form 4 class achieved a mean score of 8.2, with 12 students earning straight A grades.", "Achievements", "2026-05-20", WEBSITE_IMAGES.classroom),
  mkArticle("open-day-july-2026", "Open Day & Campus Tour — 15 July 2026", "Prospective families are invited to tour our facilities and meet our leadership team.", "Events", "2026-06-01", WEBSITE_IMAGES.campusBanner),
  mkArticle("cbc-grade-6-assessment", "Grade 6 Learners Excel in National Assessment", "Our inaugural CBC cohort demonstrated outstanding performance in the June national assessment.", "Achievements", "2026-06-05", WEBSITE_IMAGES.classroom),
  mkArticle("new-science-lab", "State-of-the-Art Science Lab Officially Opened", "The new laboratory will enhance practical learning for Form 3 and Form 4 sciences.", "News", "2026-05-15", WEBSITE_IMAGES.classroom),
  mkArticle("inter-house-athletics", "Inter-House Athletics Championships 2026", "Blue House emerged victorious in a thrilling day of track and field events.", "Events", "2026-05-10", WEBSITE_IMAGES.sports),
  mkArticle("debate-team-Nairobi", "Debate Team Wins Nairobi County Championship", "Primrose debaters will represent the county at the national finals in Nairobi.", "Achievements", "2026-04-28", WEBSITE_IMAGES.classroom),
  mkArticle("parent-portal-launch", "ShuleSmart Parent Portal Now Live", "Parents can now view fees, attendance, and report cards online via the new portal.", "Announcements", "2026-04-15", WEBSITE_IMAGES.library),
  mkArticle("music-drama-festival", "Annual Music & Drama Festival Set for August", "Learners are rehearsing for the highly anticipated cultural showcase.", "Events", "2026-04-01", WEBSITE_IMAGES.sports),
  mkArticle("tree-planting-initiative", "Environmental Club Plants 500 Trees", "Learners partnered with Nairobi Municipality on a reforestation project.", "News", "2026-03-20", WEBSITE_IMAGES.campusBanner),
  mkArticle("scholarship-programme-2026", "Merit Scholarship Programme Announced", "Five full scholarships available for outstanding KCPE candidates joining Form 1.", "Announcements", "2026-03-10", WEBSITE_IMAGES.classroom),
  mkArticle("staff-development-workshop", "Teachers Complete CBC Training Workshop", "All Junior School teachers certified in the latest KICD curriculum guidelines.", "News", "2026-02-28", WEBSITE_IMAGES.principal),
  mkArticle("boarding-facilities-upgrade", "Boarding Wing Renovation Complete", "Modern dormitories with improved study areas now welcome returning boarders.", "News", "2026-02-15", WEBSITE_IMAGES.campusBanner),
];
export const getNewsArticles = (): NewsArticle[] => [..._newsArticles];
export const setNewsArticles = (data: NewsArticle[]) => { _newsArticles = data; };

// ─── Gallery Items ────────────────────────────────────────────────────────────

const ALBUM_IMAGES: Record<GalleryItem["album"], string> = {
  Campus: WEBSITE_IMAGES.campusBanner,
  Sports: WEBSITE_IMAGES.sports,
  Arts: WEBSITE_IMAGES.library,
  Events: WEBSITE_IMAGES.sports,
  Classroom: WEBSITE_IMAGES.classroom,
};
const ALBUMS: GalleryItem["album"][] = ["Campus", "Sports", "Arts", "Events", "Classroom"];
const ASPECTS: GalleryItem["aspect"][] = ["landscape", "portrait", "square"];
const TITLES = ["Morning Assembly", "Science Practical", "Football Match", "Art Exhibition", "Library Session", "Boarding Dorm", "Graduation Day", "Chemistry Lab"];

let _galleryItems: GalleryItem[] = Array.from({ length: 24 }, (_, i) => {
  const album = ALBUMS[i % ALBUMS.length];
  return { id: `g${i + 1}`, title: TITLES[i % 8], album, image: ALBUM_IMAGES[album], aspect: ASPECTS[i % ASPECTS.length] };
});
export const getGalleryItems = (): GalleryItem[] => [..._galleryItems];
export const setGalleryItems = (data: GalleryItem[]) => { _galleryItems = data; };

// ─── Testimonials ─────────────────────────────────────────────────────────────

let _testimonials: Testimonial[] = [
  { id: "t1", name: "Grace Wanjiku", role: "Parent, Grade 6", quote: "Primrose has transformed my daughter's confidence. The teachers genuinely care about every child.", gradient: "linear-gradient(135deg, #1565C0, #42A5F5)" },
  { id: "t2", name: "James Otieno", role: "Alumnus, KCSE 2023 — A", quote: "The discipline and mentorship I received here prepared me for university. I am forever grateful.", gradient: "linear-gradient(135deg, #2E7D32, #66BB6A)" },
  { id: "t3", name: "Faith Chemutai", role: "Parent, Form 2 Boarder", quote: "As a working parent in Nairobi, I trust Primrose's boarding programme completely. Excellent pastoral care.", gradient: "linear-gradient(135deg, #F57F17, #FFB74D)" },
  { id: "t4", name: "Peter Kariuki", role: "Parent, PP2", quote: "The CBC approach is well implemented. My son loves going to school every morning!", gradient: "linear-gradient(135deg, #6A1B9A, #AB47BC)" },
];
export const getTestimonials = (): Testimonial[] => [..._testimonials];
export const setTestimonials = (data: Testimonial[]) => { _testimonials = data; };

// ─── Upcoming Events ──────────────────────────────────────────────────────────

let _upcomingEvents: UpcomingEvent[] = [
  { id: "e1", title: "Open Day & Campus Tour", date: "15 Jul 2026", time: "9:00 AM", location: "Main Hall" },
  { id: "e2", title: "Inter-House Athletics", date: "22 Jul 2026", time: "8:00 AM", location: "Sports Ground" },
  { id: "e3", title: "Parent-Teacher Conference", date: "3 Aug 2026", time: "2:00 PM", location: "Classrooms" },
  { id: "e4", title: "Music & Drama Festival", date: "10 Aug 2026", time: "10:00 AM", location: "Amphitheatre" },
];
export const getUpcomingEvents = (): UpcomingEvent[] => [..._upcomingEvents];
export const setUpcomingEvents = (data: UpcomingEvent[]) => { _upcomingEvents = data; };

// ─── FAQs ─────────────────────────────────────────────────────────────────────

let _faqItems: FaqItem[] = [
  { id: "f1", question: "How do I access the parent portal?", answer: "Visit the Parent Portal link on our website or go to /login. Use the credentials provided during admission. Contact the office if you need a password reset." },
  { id: "f2", question: "What are the school fees payment methods?", answer: "We accept M-Pesa (Paybill 522533), bank transfer, and cash at the accounts office. Always use your child's admission number as the reference." },
  { id: "f3", question: "What is the school uniform policy?", answer: "Full uniform is required Monday–Thursday. PE kit on Wednesdays. Boarders have additional house wear. Uniforms are available at the school shop." },
  { id: "f4", question: "How do I report my child's absence?", answer: "Call the class teacher or send an SMS to 0712 345 678 before 8:00 AM. For extended absence, submit a written note to the deputy principal." },
  { id: "f5", question: "When are parent-teacher conferences held?", answer: "Formal conferences are held once per term. Informal meetings can be arranged through the class teacher with 48 hours' notice." },
  { id: "f6", question: "What meals are provided for boarders?", answer: "Three balanced meals daily plus an evening snack. Special dietary needs can be accommodated with medical documentation." },
  { id: "f7", question: "How are academic reports shared?", answer: "End-of-term report cards are issued physically and uploaded to the parent portal. Mid-term progress updates are sent via SMS." },
  { id: "f8", question: "What transport options are available?", answer: "School buses serve Nairobi Town, Lanet, and Njoro routes. Route maps and fees are available from the transport coordinator." },
  { id: "f9", question: "How does the admission process work?", answer: "Submit an online application, attend an assessment interview, receive an offer letter, and complete enrollment with required documents and fees." },
  { id: "f10", question: "Are scholarships available?", answer: "Yes. Merit scholarships are awarded annually to outstanding KCPE candidates. Financial aid applications are reviewed by the bursar's office." },
  { id: "f11", question: "What extracurricular activities are offered?", answer: "Sports, music, drama, debate, scouting, environmental club, robotics, and Christian union among others. See our School Life page for details." },
  { id: "f12", question: "How can I contact the principal?", answer: "Email principal@primroseacademy.ac.ke or call 0712 345 678 ext. 101. Appointments can be scheduled through the school secretary." },
];
export const getFaqItems = (): FaqItem[] => [..._faqItems];
export const setFaqItems = (data: FaqItem[]) => { _faqItems = data; };

// Keep old export names for backward compat with parents/page.tsx
export const PARENT_FAQS = _faqItems;

// ─── Downloads ────────────────────────────────────────────────────────────────

let _downloadItems: DownloadItem[] = [
  { id: "d1", title: "Parent Handbook 2026", description: "Policies, procedures, and important dates.", fileType: "PDF", size: "2.4 MB" },
  { id: "d2", title: "Fee Structure 2026", description: "Day and boarding fees by grade level.", fileType: "PDF", size: "890 KB" },
  { id: "d3", title: "Uniform Price List", description: "Complete uniform and PE kit pricing.", fileType: "PDF", size: "450 KB" },
  { id: "d4", title: "Medical Form", description: "Health information for new admissions.", fileType: "PDF", size: "320 KB" },
  { id: "d5", title: "Transport Routes Map", description: "Bus routes and pickup points.", fileType: "PDF", size: "1.1 MB" },
  { id: "d6", title: "Portal User Guide", description: "Step-by-step ShuleSmart portal instructions.", fileType: "PDF", size: "1.8 MB" },
];
export const getDownloadItems = (): DownloadItem[] => [..._downloadItems];
export const setDownloadItems = (data: DownloadItem[]) => { _downloadItems = data; };

// Keep old export name for backward compat with parents/page.tsx
export const PARENT_DOWNLOADS = _downloadItems;

// ─── Fee Structure ────────────────────────────────────────────────────────────

export interface FeeScheduleEntry {
  grade: string;
  tuition: number;
  activity: number;
  total: number;
}
export interface FeeStructureData {
  day: FeeScheduleEntry[];
  boarding: FeeScheduleEntry[];
}

let _feeStructure: FeeStructureData = {
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
export const getFeeStructure = (): FeeStructureData => ({ day: [..._feeStructure.day], boarding: [..._feeStructure.boarding] });
export const setFeeStructure = (data: FeeStructureData) => { _feeStructure = data; };

// Keep old export name for backward compat with admissions/page.tsx
export const FEE_STRUCTURE = _feeStructure;

// ─── Admission Spaces ─────────────────────────────────────────────────────────

let _admissionSpaces = [
  { grade: "PP1", day: 4, boarding: 0 },
  { grade: "PP2", day: 2, boarding: 0 },
  { grade: "Grade 4", day: 6, boarding: 3 },
  { grade: "Grade 6", day: 3, boarding: 2 },
  { grade: "Grade 8", day: 5, boarding: 4 },
  { grade: "Form 1", day: 8, boarding: 6 },
  { grade: "Form 2", day: 4, boarding: 2 },
  { grade: "Form 3", day: 2, boarding: 1 },
];
export const getAdmissionSpaces = () => [..._admissionSpaces];
export const setAdmissionSpaces = (data: typeof _admissionSpaces) => { _admissionSpaces = data; };

// Keep old export name for backward compat with admissions/page.tsx
export const ADMISSION_SPACES = _admissionSpaces;

// ─── Contact Submissions ──────────────────────────────────────────────────────

let _contactSubmissions: ContactSubmission[] = [
  {
    id: "cs-1",
    name: "Esther Kamau",
    email: "esther.kamau@gmail.com",
    phone: "0722 111 222",
    subject: "Admission Inquiry",
    message: "Good morning. I would like to inquire about available spaces for Grade 4 and Form 1 for the 2026 intake. My children are currently at Nairobi Primary and I am considering transferring them to a better school for the upcoming term.",
    submittedAt: "2026-06-20T08:34:00Z",
    status: "unread",
  },
  {
    id: "cs-2",
    name: "Joseph Mwangi",
    email: "joe.mwangi@outlook.com",
    phone: "0733 445 566",
    subject: "Fee Structure Question",
    message: "Hello. Could you please send me the detailed fee structure for boarding students in Form 1 for Term 3, 2026? I also want to know if there are sibling discounts available.",
    submittedAt: "2026-06-19T14:12:00Z",
    status: "unread",
  },
  {
    id: "cs-3",
    name: "Priscilla Odhiambo",
    email: "priscilla.o@yahoo.com",
    phone: "0711 334 455",
    subject: "Term Dates",
    message: "Please confirm the exact opening and closing dates for Term 3, 2026. We are planning family travel and need to arrange around school days.",
    submittedAt: "2026-06-18T10:05:00Z",
    status: "read",
  },
  {
    id: "cs-4",
    name: "Samuel Ndung'u",
    email: "samuel.ndungu@safaricom.co.ke",
    phone: "0700 998 877",
    subject: "Boarding Availability",
    message: "I have a son joining Form 2 next term. Is boarding still available? What is included in the boarding fee and what items should he bring?",
    submittedAt: "2026-06-17T16:45:00Z",
    status: "unread",
  },
  {
    id: "cs-5",
    name: "Alice Wangari",
    email: "alice.wangari@gmail.com",
    phone: "0755 123 456",
    subject: "General Inquiry",
    message: "We are a family relocating from Nairobi to Nairobi. We are looking for a reputable school for our PP2 daughter. Can we schedule a campus visit?",
    submittedAt: "2026-06-15T09:20:00Z",
    status: "replied",
    repliedAt: "2026-06-16T11:00:00Z",
    replyNote: "Welcomed the family and scheduled a campus tour for Saturday 21st June at 10:00 AM.",
  },
  {
    id: "cs-6",
    name: "Michael Njoroge",
    email: "michael.njoroge@ke.ibm.com",
    phone: "0720 876 543",
    subject: "Admission Inquiry",
    message: "I am interested in enrolling my daughter in the CBC stream for Grade 7. What are the admission requirements and what documents are needed?",
    submittedAt: "2026-06-14T13:30:00Z",
    status: "read",
  },
  {
    id: "cs-7",
    name: "Fatuma Hassan",
    email: "fatuma.h@gmail.com",
    subject: "Transport Routes",
    message: "Does the school have a bus route that serves the Lanet area? My son would be a day scholar and we need reliable transport.",
    submittedAt: "2026-06-12T07:55:00Z",
    status: "replied",
    repliedAt: "2026-06-13T09:00:00Z",
    replyNote: "Confirmed Lanet route and shared the transport coordinator contact.",
  },
  {
    id: "cs-8",
    name: "Robert Kipchoge",
    email: "robert.kip@gmail.com",
    phone: "0712 654 321",
    subject: "School Fees Payment",
    message: "I would like to confirm the M-Pesa Paybill number and the correct account reference to use when paying school fees.",
    submittedAt: "2026-06-10T11:15:00Z",
    status: "archived",
  },
];
export const getContactSubmissions = (): ContactSubmission[] => [..._contactSubmissions];
export const setContactSubmissions = (data: ContactSubmission[]) => { _contactSubmissions = data; };

// ─── Application Submissions ──────────────────────────────────────────────────

let _applicationSubmissions: ApplicationSubmission[] = [
  {
    id: "app-1",
    applicationRef: "APP-2026-1001",
    firstName: "Amara",
    lastName: "Kamau",
    dob: "2012-03-14",
    gender: "Female",
    gradeApplying: "Form 1",
    boardingType: "boarding",
    parentName: "Daniel Kamau",
    parentPhone: "0722 111 001",
    parentEmail: "daniel.kamau@gmail.com",
    relationship: "Father",
    prevSchool: "St. Patrick's Primary, Nairobi",
    prevClass: "Grade 6",
    reason: "Seeking a school with strong boarding facilities and CBC transition support.",
    submittedAt: "2026-06-01T08:00:00Z",
    status: "pending",
  },
  {
    id: "app-2",
    applicationRef: "APP-2026-1002",
    firstName: "Brian",
    lastName: "Otieno",
    dob: "2016-07-22",
    gender: "Male",
    gradeApplying: "Grade 4",
    boardingType: "day",
    parentName: "Rose Otieno",
    parentPhone: "0733 222 002",
    parentEmail: "rose.otieno@yahoo.com",
    relationship: "Mother",
    prevSchool: "Nairobi DEB Primary",
    prevClass: "Grade 3",
    reason: "Looking for a more structured academic environment for our son.",
    submittedAt: "2026-05-28T10:30:00Z",
    status: "interview_scheduled",
    interviewDate: "2026-06-25",
    notes: "Interview booked with Deputy Principal at 10:00 AM.",
  },
  {
    id: "app-3",
    applicationRef: "APP-2026-1003",
    firstName: "Cynthia",
    lastName: "Wanjiku",
    dob: "2021-01-10",
    gender: "Female",
    gradeApplying: "PP1",
    boardingType: "day",
    parentName: "Peter Wanjiku",
    parentPhone: "0711 333 003",
    parentEmail: "p.wanjiku@gmail.com",
    relationship: "Father",
    prevSchool: "N/A",
    prevClass: "N/A",
    reason: "First school enrollment. Highly recommended by a neighbour whose child attends.",
    submittedAt: "2026-05-25T14:00:00Z",
    status: "offered",
    notes: "Offer letter sent via e-mail. Awaiting acceptance and document submission.",
  },
  {
    id: "app-4",
    applicationRef: "APP-2026-1004",
    firstName: "David",
    lastName: "Kiptoo",
    dob: "2009-11-05",
    gender: "Male",
    gradeApplying: "Form 3",
    boardingType: "boarding",
    parentName: "Sarah Kiptoo",
    parentPhone: "0700 444 004",
    parentEmail: "sarah.kiptoo@outlook.com",
    relationship: "Mother",
    prevSchool: "Rift Valley Academy, Kijabe",
    prevClass: "Form 2",
    reason: "Family relocation from Kijabe to Nairobi. Needs boarding close to relatives.",
    submittedAt: "2026-05-20T09:15:00Z",
    status: "enrolled",
    notes: "All documents received. Admission number GFA-2026-0341 issued.",
  },
  {
    id: "app-5",
    applicationRef: "APP-2026-1005",
    firstName: "Eva",
    lastName: "Muthoni",
    dob: "2014-06-18",
    gender: "Female",
    gradeApplying: "Grade 7",
    boardingType: "boarding",
    parentName: "John Muthoni",
    parentPhone: "0755 555 005",
    parentEmail: "john.muthoni@gmail.com",
    relationship: "Father",
    prevSchool: "Moi Primary, Nairobi",
    prevClass: "Grade 6",
    reason: "Transition to boarding for Secondary to reduce daily commute.",
    submittedAt: "2026-05-18T11:45:00Z",
    status: "rejected",
    notes: "No available boarding spaces for Grade 7 girls. Placed on waitlist.",
  },
  {
    id: "app-6",
    applicationRef: "APP-2026-1006",
    firstName: "Felix",
    lastName: "Kariuki",
    dob: "2015-09-30",
    gender: "Male",
    gradeApplying: "Grade 6",
    boardingType: "day",
    parentName: "Anne Kariuki",
    parentPhone: "0720 666 006",
    parentEmail: "anne.kariuki@gmail.com",
    relationship: "Mother",
    prevSchool: "Greenview Primary",
    prevClass: "Grade 5",
    reason: "Better CBC implementation and school environment.",
    submittedAt: "2026-05-15T08:00:00Z",
    status: "withdrawn",
    notes: "Parent withdrew application — chose to remain at current school.",
  },
  {
    id: "app-7",
    applicationRef: "APP-2026-1007",
    firstName: "Grace",
    lastName: "Njeri",
    dob: "2012-04-25",
    gender: "Female",
    gradeApplying: "Form 1",
    boardingType: "day",
    parentName: "Samuel Njeri",
    parentPhone: "0712 777 007",
    parentEmail: "s.njeri@gmail.com",
    relationship: "Father",
    prevSchool: "ACK Primary, Nairobi",
    prevClass: "Grade 6",
    reason: "Excellent KCPE results. Looking for a school that offers strong KCSE preparation.",
    submittedAt: "2026-06-05T07:30:00Z",
    status: "pending",
  },
  {
    id: "app-8",
    applicationRef: "APP-2026-1008",
    firstName: "Hassan",
    lastName: "Abdi",
    dob: "2016-12-12",
    gender: "Male",
    gradeApplying: "Grade 4",
    boardingType: "boarding",
    parentName: "Amina Abdi",
    parentPhone: "0733 888 008",
    parentEmail: "amina.abdi@gmail.com",
    relationship: "Mother",
    prevSchool: "Eastleigh Primary, Nairobi",
    prevClass: "Grade 3",
    reason: "Relocating from Nairobi. Need boarding near extended family in Nairobi.",
    submittedAt: "2026-06-08T09:00:00Z",
    status: "interview_scheduled",
    interviewDate: "2026-06-28",
    notes: "Remote interview arranged via video call.",
  },
  {
    id: "app-9",
    applicationRef: "APP-2026-1009",
    firstName: "Irene",
    lastName: "Cherop",
    dob: "2020-02-14",
    gender: "Female",
    gradeApplying: "PP2",
    boardingType: "day",
    parentName: "Mark Cherop",
    parentPhone: "0711 999 009",
    parentEmail: "mark.cherop@outlook.com",
    relationship: "Father",
    prevSchool: "Sunny Kids Nursery",
    prevClass: "PP1",
    reason: "Happy with PP1 at Sunny Kids but want better standard for PP2.",
    submittedAt: "2026-06-10T13:20:00Z",
    status: "offered",
    notes: "Place offered for PP2 day. Parent to confirm by 30 June.",
  },
  {
    id: "app-10",
    applicationRef: "APP-2026-1010",
    firstName: "James",
    lastName: "Mutua",
    dob: "2010-08-20",
    gender: "Male",
    gradeApplying: "Form 2",
    boardingType: "boarding",
    parentName: "Lucy Mutua",
    parentPhone: "0722 010 010",
    parentEmail: "lucy.mutua@gmail.com",
    relationship: "Mother",
    prevSchool: "Starehe Boys Centre, Nairobi",
    prevClass: "Form 1",
    reason: "Transfer due to family financial constraints. Primrose closer to home.",
    submittedAt: "2026-05-30T10:00:00Z",
    status: "enrolled",
    notes: "Fully enrolled. All fees cleared. Admission number GFA-2026-0357.",
  },
  {
    id: "app-11",
    applicationRef: "APP-2026-1011",
    firstName: "Karin",
    lastName: "Achieng",
    dob: "2013-05-17",
    gender: "Female",
    gradeApplying: "Grade 8",
    boardingType: "boarding",
    parentName: "Paul Achieng",
    parentPhone: "0700 011 011",
    parentEmail: "paul.achieng@gmail.com",
    relationship: "Father",
    prevSchool: "Kisumu Girls Primary",
    prevClass: "Grade 7",
    reason: "Father transferred to Nairobi County. Need a CBC school with boarding.",
    submittedAt: "2026-06-12T11:00:00Z",
    status: "pending",
  },
  {
    id: "app-12",
    applicationRef: "APP-2026-1012",
    firstName: "Lydia",
    lastName: "Wairimu",
    dob: "2012-10-03",
    gender: "Female",
    gradeApplying: "Form 1",
    boardingType: "day",
    parentName: "George Wairimu",
    parentPhone: "0755 012 012",
    parentEmail: "george.wairimu@gmail.com",
    relationship: "Father",
    prevSchool: "Nairobi Day Secondary",
    prevClass: "Grade 6",
    reason: "Excellent KCPE performance. Wants the best Form 1 environment in Nairobi.",
    submittedAt: "2026-06-15T08:45:00Z",
    status: "pending",
  },
];
export const getApplicationSubmissions = (): ApplicationSubmission[] => [..._applicationSubmissions];
export const setApplicationSubmissions = (data: ApplicationSubmission[]) => { _applicationSubmissions = data; };

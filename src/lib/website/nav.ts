/**
 * Config-driven navigation for the public website.
 * Editing these arrays updates the header mega-menus, top bar, footer
 * columns and social icons — no JSX changes required.
 * @module website/nav
 */

/** A single navigation link. */
export interface NavLink {
  label: string;
  href: string;
}

/** A titled column of links inside a mega-menu panel. */
export interface MegaColumn {
  heading: string;
  links: NavLink[];
}

/** A primary navigation item — either a direct link or a mega-menu. */
export interface NavItem {
  label: string;
  href?: string;
  columns?: MegaColumn[];
}

/** Thin utility strip links (mirrors Kabarak's top row of quick links). */
export const TOP_BAR_LINKS: NavLink[] = [
  { label: "Parent Portal", href: "/login" },
  { label: "Downloads", href: "/parents" },
  { label: "Gallery", href: "/gallery" },
  { label: "Our Staff", href: "/our-staff" },
  { label: "News", href: "/news" },
  { label: "Contact", href: "/contact" },
];

/** Social profiles shown as icons in the top bar and footer. */
export const SOCIAL_LINKS: { label: string; href: string; icon: "facebook" | "twitter" | "youtube" | "linkedin" | "instagram" }[] = [
  { label: "Facebook", href: "https://facebook.com", icon: "facebook" },
  { label: "Twitter", href: "https://twitter.com", icon: "twitter" },
  { label: "YouTube", href: "https://youtube.com", icon: "youtube" },
  { label: "LinkedIn", href: "https://linkedin.com", icon: "linkedin" },
  { label: "Instagram", href: "https://instagram.com", icon: "instagram" },
];

/** Primary navigation with comprehensive multi-column mega-menus. */
export const MAIN_NAV: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "About",
    columns: [
      {
        heading: "The School",
        links: [
          { label: "Our Story", href: "/about#story" },
          { label: "Vision & Mission", href: "/about#vision" },
          { label: "Leadership", href: "/about#leadership" },
          { label: "Accreditation", href: "/about#accreditation" },
        ],
      },
      {
        heading: "Our Campus",
        links: [
          { label: "Facilities", href: "/about#facilities" },
          { label: "Boarding", href: "/school-life#boarding" },
          { label: "Our Staff", href: "/our-staff" },
          { label: "Photo Gallery", href: "/gallery" },
        ],
      },
      {
        heading: "Community",
        links: [
          { label: "Parent Resources", href: "/parents" },
          { label: "News & Events", href: "/news" },
          { label: "Contact Us", href: "/contact" },
        ],
      },
    ],
  },
  {
    label: "Academics",
    columns: [
      {
        heading: "Curriculum",
        links: [
          { label: "CBC Programme", href: "/academics#cbc" },
          { label: "8-4-4 (KNEC)", href: "/academics#844" },
          { label: "Academic Calendar", href: "/academics#calendar" },
        ],
      },
      {
        heading: "Performance",
        links: [
          { label: "KCSE Results", href: "/academics#results" },
          { label: "National Assessments", href: "/academics#results" },
          { label: "Awards & Honours", href: "/news" },
        ],
      },
      {
        heading: "Support",
        links: [
          { label: "Library", href: "/about#facilities" },
          { label: "ICT Centre", href: "/about#facilities" },
          { label: "Career Guidance", href: "/school-life#leadership" },
        ],
      },
    ],
  },
  {
    label: "Admissions",
    columns: [
      {
        heading: "Get Started",
        links: [
          { label: "How to Apply", href: "/admissions#process" },
          { label: "Apply Online", href: "/admissions/apply" },
          { label: "Available Spaces", href: "/admissions#spaces" },
        ],
      },
      {
        heading: "Fees & Aid",
        links: [
          { label: "Fee Structure", href: "/admissions#fees" },
          { label: "Scholarships", href: "/admissions#scholarships" },
          { label: "Payment Options", href: "/admissions#fees" },
        ],
      },
      {
        heading: "Resources",
        links: [
          { label: "Downloads", href: "/parents" },
          { label: "FAQ", href: "/parents#faq" },
          { label: "Contact Admissions", href: "/contact" },
        ],
      },
    ],
  },
  {
    label: "School Life",
    columns: [
      {
        heading: "Activities",
        links: [
          { label: "Sports", href: "/school-life#sports" },
          { label: "Clubs & Societies", href: "/school-life#clubs" },
          { label: "Arts & Culture", href: "/school-life#arts" },
        ],
      },
      {
        heading: "Student Life",
        links: [
          { label: "Leadership", href: "/school-life#leadership" },
          { label: "Boarding", href: "/school-life#boarding" },
          { label: "Christian Union", href: "/school-life#clubs" },
        ],
      },
      {
        heading: "Media",
        links: [
          { label: "Photo Gallery", href: "/gallery" },
          { label: "News & Events", href: "/news" },
        ],
      },
    ],
  },
  { label: "News", href: "/news" },
  { label: "Contact", href: "/contact" },
];

/** Footer link columns (adapted from Kabarak's multi-column footer). */
export const FOOTER_COLUMNS: MegaColumn[] = [
  {
    heading: "Explore",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Academics", href: "/academics" },
      { label: "Admissions", href: "/admissions" },
      { label: "School Life", href: "/school-life" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "News & Events", href: "/news" },
      { label: "Gallery", href: "/gallery" },
      { label: "Downloads", href: "/parents" },
      { label: "Parent Resources", href: "/parents" },
    ],
  },
  {
    heading: "Quick Links",
    links: [
      { label: "Apply Online", href: "/admissions/apply" },
      { label: "Parent Portal", href: "/login" },
      { label: "Fee Structure", href: "/admissions#fees" },
      { label: "Our Staff", href: "/our-staff" },
    ],
  },
  {
    heading: "Public Info",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Use", href: "/terms" },
      { label: "FAQ", href: "/parents#faq" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

/** Quick-access icon tiles for the homepage portal section. */
export const QUICK_ACCESS: { label: string; href: string; icon: string }[] = [
  { label: "Parent Portal", href: "/login", icon: "portal" },
  { label: "Apply Online", href: "/admissions/apply", icon: "apply" },
  { label: "Fee Structure", href: "/admissions#fees", icon: "fees" },
  { label: "Downloads", href: "/parents", icon: "downloads" },
  { label: "News & Events", href: "/news", icon: "news" },
  { label: "Contact Us", href: "/contact", icon: "contact" },
];
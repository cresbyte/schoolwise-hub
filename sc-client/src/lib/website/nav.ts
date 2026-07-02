/**
 * Website navigation configuration.
 * Central nav data for mega-menus and quick links.
 */

/** Quick access links for the homepage "I Want To..." section */
export const QUICK_ACCESS = [
  { label: "Parent Portal", href: "/portal", icon: "portal" },
  { label: "Apply Now", href: "/admissions/apply", icon: "apply" },
  { label: "Pay Fees", href: "/parents#fees", icon: "fees" },
  { label: "Downloads", href: "/parents#downloads", icon: "downloads" },
  { label: "News", href: "/news", icon: "news" },
  { label: "Contact Us", href: "/contact", icon: "contact" },
];

/** Main navigation structure for mega-menu */
export const MAIN_NAV = [
  {
    label: "About",
    href: "/about",
    children: [
      {
        label: "Our School",
        href: "/about",
        description: "Learn about our history, values, and leadership",
      },
      {
        label: "Our Staff",
        href: "/our-staff",
        description: "Meet our dedicated teachers and administrators",
      },
      {
        label: "Gallery",
        href: "/gallery",
        description: "Photos from events, facilities, and student life",
      },
    ],
  },
  {
    label: "Academics",
    href: "/academics",
    children: [
      {
        label: "Curriculum",
        href: "/academics#curriculum",
        description: "CBC curriculum and teaching approach",
      },
      {
        label: "Assessment",
        href: "/academics#assessment",
        description: "How we evaluate and support student progress",
      },
      {
        label: "School Life",
        href: "/school-life",
        description: "Activities, clubs, and student experience",
      },
    ],
  },
  {
    label: "Admissions",
    href: "/admissions",
    children: [
      {
        label: "Why Primrose",
        href: "/admissions#why-primrose",
        description: "What makes us the right choice for your child",
      },
      {
        label: "Apply Online",
        href: "/admissions/apply",
        description: "Start your application today",
      },
      {
        label: "Fees & Financials",
        href: "/admissions#fees",
        description: "Tuition, fees, and payment options",
      },
    ],
  },
  {
    label: "Parents",
    href: "/parents",
    children: [
      {
        label: "Parent Portal",
        href: "/portal",
        description: "Access grades, reports, and student info",
      },
      {
        label: "Fee Payment",
        href: "/parents#fees",
        description: "Pay school fees online",
      },
      {
        label: "Resources",
        href: "/parents#downloads",
        description: "Download forms, handbooks, and guides",
      },
    ],
  },
  {
    label: "News",
    href: "/news",
  },
  {
    label: "Contact",
    href: "/contact",
  },
];

/** Footer link structure */
export const FOOTER_LINKS = {
  about: [
    { label: "Our Story", href: "/about" },
    { label: "Our Staff", href: "/our-staff" },
    { label: "Gallery", href: "/gallery" },
    { label: "School Life", href: "/school-life" },
  ],
  academics: [
    { label: "Curriculum", href: "/academics" },
    { label: "CBC", href: "/academics#cbc" },
    { label: "Assessment", href: "/academics#assessment" },
  ],
  admissions: [
    { label: "Apply Now", href: "/admissions/apply" },
    { label: "Why Primrose", href: "/admissions#why-primrose" },
    { label: "Fees", href: "/admissions#fees" },
  ],
  parents: [
    { label: "Parent Portal", href: "/portal" },
    { label: "Fee Payment", href: "/parents#fees" },
    { label: "Downloads", href: "/parents#downloads" },
    { label: "Contact Us", href: "/contact" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Use", href: "/terms" },
  ],
};

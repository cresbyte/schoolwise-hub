/**
 * Public website constants for Primrose Private Academy.
 * @module website/constants
 */

/** School identity and contact details for the public website. */
export const SCHOOL = {
  name: "Primrose Private Academy",
  shortName: "Primrose",
  location: "Nairobi County, Kenya",
  motto: "Excellence Through Knowledge",
  tagline: "Nurturing Tomorrow's Leaders Today",
  curriculum: "CBC + 8-4-4 (Junior and Senior Secondary)",
  type: "Private Day & Boarding School, PP1 to Form 4",
  phone: "0712 345 678",
  phoneRaw: "254712345678",
  whatsapp: "254712345678",
  email: "info@primroseacademy.ac.ke",
  admissionsEmail: "admissions@primroseacademy.ac.ke",
  address: "Milimani Road, Nairobi Town",
  postal: "P.O. Box 1245-20100, Nairobi",
  county: "Nairobi",
  knecCode: "30412104",
  principal: "Mr. Daniel Kamau",
  founded: 2008,
  ogImage: "/og-primrose.jpg",
};

/** Mutable copy of school identity — mutated by the CMS school-info editor. */
let _schoolInfo = { ...SCHOOL };
export type SchoolInfo = typeof _schoolInfo;
export const getSchoolInfo = (): SchoolInfo => ({ ..._schoolInfo });
export const setSchoolInfo = (patch: Partial<SchoolInfo>) => {
  _schoolInfo = { ..._schoolInfo, ...patch };
};

export const HEADING_FONT = "'Outfit', system-ui, -apple-system, sans-serif";
export const BODY_FONT = "'Outfit', system-ui, -apple-system, sans-serif";

/** Website-only colour tokens (aligned with MUI theme). */
export const WEBSITE_COLORS = {
  primary: "#1A3A6B",
  primaryDark: "#0F2347",
  secondary: "#C8922A",
  secondaryLight: "#F5B942",
  accent: "#1E6E3A",
  bgWhite: "#FFFFFF",
  bgAlt: "#F8FAFD",
  bgNavy: "#0F1923",
  navbarBg: "#1A3A6B",
  navbarText: "#FFFFFF",
  footerBg: "#0F1923",
  footerText: "#94A3B8",
  whatsapp: "#25D366",
  whatsappDark: "#1DA851",
} as const;

/** Public website image assets served from /public/images/. */
export const WEBSITE_IMAGES = {
  campusBanner: "/images/Main Banner Image.jpeg",
  classroom: "/images/Students in Classroom.jpeg",
  sports: "/images/School Sports Day.jpeg",
  library: "/images/School Library.jpeg",
  principal: "/images/School Principal.jpeg",
} as const;

/** Default SEO keywords for the school website. */
export const DEFAULT_KEYWORDS = [
  "Primrose Private Academy",
  "Nairobi schools",
  "Kenyan private school",
  "CBC curriculum",
  "8-4-4",
  "boarding school Nairobi",
  "KCSE",
] as const;

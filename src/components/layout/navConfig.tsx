/**
 * Sidebar navigation configuration with role-based visibility.
 * @module navConfig
 */
import type { ReactNode } from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AssignmentIcon from "@mui/icons-material/Assignment";
import DescriptionIcon from "@mui/icons-material/Description";
import ScheduleIcon from "@mui/icons-material/Schedule";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ReceiptIcon from "@mui/icons-material/Receipt";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaymentsIcon from "@mui/icons-material/Payments";
import WarningIcon from "@mui/icons-material/Warning";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import BadgeIcon from "@mui/icons-material/Badge";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import BarChartIcon from "@mui/icons-material/BarChart";
import DownloadIcon from "@mui/icons-material/Download";
import HistoryIcon from "@mui/icons-material/History";
import SettingsIcon from "@mui/icons-material/Settings";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import MessageIcon from "@mui/icons-material/Message";
import LanguageIcon from "@mui/icons-material/Language";
import ArticleIcon from "@mui/icons-material/Article";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import HomeIcon from "@mui/icons-material/Home";
import InfoIcon from "@mui/icons-material/Info";
import MailIcon from "@mui/icons-material/Mail";

export interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
  permission?: string;
}
export interface NavGroup {
  heading: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    heading: "Overview",
    items: [{ label: "Dashboard", to: "/dashboard", icon: <DashboardIcon />, permission: "reports.view" }],
  },
  {
    heading: "Students",
    items: [
      { label: "All Students", to: "/students", icon: <PeopleIcon />, permission: "students.view" },
      { label: "Classes & Streams", to: "/classes", icon: <SchoolIcon />, permission: "classes.view" },
      { label: "Attendance", to: "/attendance", icon: <EventAvailableIcon />, permission: "attendance.write" },
    ],
  },
  {
    heading: "Academics",
    items: [
      { label: "Subjects", to: "/subjects", icon: <MenuBookIcon />, permission: "classes.view" },
      { label: "Teacher Assignments", to: "/subjects/assignments", icon: <AssignmentIndIcon />, permission: "classes.view" },
      { label: "Examinations", to: "/exams", icon: <AssignmentIcon />, permission: "exams.marks" },
      { label: "Report Cards", to: "/report-cards", icon: <DescriptionIcon />, permission: "exams.view" },
      { label: "Timetable", to: "/timetable", icon: <ScheduleIcon />, permission: "timetable.view" },
      { label: "Term Planner", to: "/term-planner", icon: <CalendarMonthIcon />, permission: "classes.view" },
    ],
  },
  {
    heading: "Communication",
    items: [{ label: "Messages", to: "/messages", icon: <MessageIcon />, permission: "reports.view" }],
  },
  {
    heading: "Finance",
    items: [
      { label: "Fee Structures", to: "/fees/structures", icon: <ReceiptIcon />, permission: "fees.view" },
      { label: "Special Levies", to: "/fees/levies", icon: <ReceiptLongIcon />, permission: "fees.view" },
      { label: "Fee Collection", to: "/fees/collection", icon: <PaymentsIcon />, permission: "fees.view" },
      { label: "Outstanding Fees", to: "/fees/outstanding", icon: <WarningIcon />, permission: "fees.view" },
      { label: "Payroll", to: "/payroll", icon: <AccountBalanceWalletIcon />, permission: "payroll.view" },
    ],
  },
  {
    heading: "Staff",
    items: [
      { label: "All Staff", to: "/staff", icon: <BadgeIcon />, permission: "staff.view" },
      { label: "Leave Management", to: "/staff/leave", icon: <BeachAccessIcon />, permission: "staff.view" },
    ],
  },
  {
    heading: "Reports",
    items: [
      { label: "Academic Reports", to: "/reports/academic", icon: <BarChartIcon />, permission: "reports.view" },
      { label: "NEMIS Export", to: "/reports/nemis", icon: <DownloadIcon />, permission: "reports.view" },
      { label: "Audit Trail", to: "/reports/audit", icon: <HistoryIcon />, permission: "reports.view" },
    ],
  },
  {
    heading: "Website",
    items: [
      { label: "Overview", to: "/website-cms", icon: <LanguageIcon />, permission: "settings.view" },
      { label: "News & Events", to: "/website-cms/news", icon: <ArticleIcon />, permission: "settings.view" },
      { label: "Gallery", to: "/website-cms/gallery", icon: <PhotoLibraryIcon />, permission: "settings.view" },
      { label: "Applications", to: "/website-cms/applications", icon: <SchoolIcon />, permission: "settings.view" },
      { label: "Contact Messages", to: "/website-cms/contacts", icon: <MailIcon />, permission: "settings.view" },
      { label: "Testimonials", to: "/website-cms/testimonials", icon: <FormatQuoteIcon />, permission: "settings.edit" },
      { label: "Homepage Content", to: "/website-cms/homepage", icon: <HomeIcon />, permission: "settings.edit" },
      { label: "School Info", to: "/website-cms/school-info", icon: <InfoIcon />, permission: "settings.edit" },
    ],
  },
  {
    heading: "Settings",
    items: [
      { label: "School Settings", to: "/settings", icon: <SettingsIcon />, permission: "settings.view" },
      { label: "User Management", to: "/settings/users", icon: <ManageAccountsIcon />, permission: "settings.view" },
    ],
  },
];
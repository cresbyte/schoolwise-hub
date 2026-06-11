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
import ReceiptIcon from "@mui/icons-material/Receipt";
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
      { label: "Examinations", to: "/exams", icon: <AssignmentIcon />, permission: "exams.marks" },
      { label: "Report Cards", to: "/report-cards", icon: <DescriptionIcon />, permission: "exams.view" },
      { label: "Timetable", to: "/timetable", icon: <ScheduleIcon />, permission: "timetable.view" },
    ],
  },
  {
    heading: "Finance",
    items: [
      { label: "Fee Structures", to: "/fees/structures", icon: <ReceiptIcon />, permission: "fees.view" },
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
    heading: "Settings",
    items: [
      { label: "School Settings", to: "/settings", icon: <SettingsIcon />, permission: "settings.view" },
      { label: "User Management", to: "/settings/users", icon: <ManageAccountsIcon />, permission: "settings.view" },
    ],
  },
];
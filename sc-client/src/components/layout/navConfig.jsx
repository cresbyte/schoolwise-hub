/**
 * Sidebar navigation, grouped by section.
 *
 * Item fields:
 *   label                 text shown in the sidebar
 *   to                    route path
 *   icon                  an MUI icon component (not an element)
 *   permission            permission needed to see the item
 *   exact                 (optional) only highlight on an exact path match
 *   requiresClassTeacher  (optional) only show to class teachers
 */
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BadgeIcon from "@mui/icons-material/Badge";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ClassIcon from "@mui/icons-material/Class";
import DashboardIcon from "@mui/icons-material/Dashboard";
import DescriptionIcon from "@mui/icons-material/Description";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import EventNoteIcon from "@mui/icons-material/EventNote";
import GroupWorkIcon from "@mui/icons-material/GroupWork";
import LayersIcon from "@mui/icons-material/Layers";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import MessageIcon from "@mui/icons-material/Message";
import PaymentsIcon from "@mui/icons-material/Payments";
import PeopleIcon from "@mui/icons-material/People";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ReceiptIcon from "@mui/icons-material/Receipt";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import GradingIcon from "@mui/icons-material/Report";
import ScheduleIcon from "@mui/icons-material/Schedule";
import TodayIcon from "@mui/icons-material/Today";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AccessAlarmIcon from "@mui/icons-material/AccessAlarm";
import { EscalatorWarning } from "@mui/icons-material";

export const NAV_GROUPS = [
  {
    heading: "Overview",
    items: [
      { label: "Dashboard", to: "/dashboard", icon: DashboardIcon, permission: "reports.view" },
      {
        label: "Current Period",
        to: "/school/current-period",
        icon: TodayIcon,
        permission: "school.view",
      },
      {
        label: "Academic Years",
        to: "/school/academic-years",
        icon: CalendarMonthIcon,
        permission: "school.view",
      },
      {
        label: "Terms",
        to: "/school/terms",
        icon: EventNoteIcon,
        permission: "school.view",
      },
      {
        label: "Grade Levels",
        to: "/school/grade-levels",
        icon: LayersIcon,
        permission: "school.view",
      },
      {
        label: "School Calendar",
        to: "/school/calendar",
        icon: CalendarMonthIcon,
        permission: "school.view",
      },
    ],
  },

  {
    heading: "Teaching",
    items: [
      {
        label: "Classes",
        to: "/settings/classes",
        icon: ClassIcon,
        permission: "settings.view",
      },
      {
        label: "Subjects",
        to: "/settings/subjects",
        icon: MenuBookIcon,
        permission: "settings.view",
      },
      {
        label: "Teacher Assignments",
        to: "/settings/assignments",
        icon: PeopleAltIcon,
        permission: "settings.view",
      },
      {
        label: "Timetable",
        to: "/timetable/grid",
        icon: ScheduleIcon,
        permission: "timetable.view",
      },
      {
        label: "Time Schedule",
        to: "/timetable/schedule",
        icon: AccessAlarmIcon,
        permission: "schedule.view",
      },
    ],
  },
  {
    heading: "Students",
    items: [
      {
        label: "My Class",
        to: "/my-class",
        icon: GroupWorkIcon,
        permission: "students.view",
        requiresClassTeacher: true,
      },
      {
        label: "All Students",
        to: "/students",
        icon: PeopleIcon,
        permission: "students.view",
        hiddenRoles: ["teacher", "class_teacher"],
      },
      {
        label: "Year-end Promotion",
        to: "/students/promotion",
        icon: PlayArrowIcon, // or TrendingUp, Upgrade, etc.
        permission: "settings.view",
      },

      {
        label: "Take Attendance",
        to: "/attendance/take",
        icon: EventAvailableIcon,
        permission: "attendance.write",
      },
      {
        label: "Attendance Report",
        to: "/attendance/report",
        icon: AssessmentIcon,
        permission: "attendance.view",
      },
      {
        label: "At-risk Students",
        to: "/attendance/at-risk",
        icon: WarningAmberIcon,
        permission: "attendance.view",
      },
    ],
  },
  {
    heading: "Fees",
    items: [
      {
        label: "Fee Structures",
        to: "/fees/structures",
        icon: AccountBalanceWalletIcon,
        permission: "fees.view",
      },
      {
        label: "Invoices",
        to: "/fees/invoices",
        icon: ReceiptIcon,
        permission: "fees.view",
      },
      {
        label: "Payments",
        to: "/fees/payments",
        icon: PaymentsIcon,
        permission: "fees.view",
      },
      {
        label: "Outstanding",
        to: "/fees/outstanding",
        icon: WarningAmberIcon,
        permission: "fees.view",
      },
      {
        label: "One-off Charges",
        to: "/fees/charges",
        icon: ReceiptLongIcon,
        permission: "fees.view",
      },
    ],
  },

  {
    heading: "Academics",
    items: [
      { label: "Examinations", to: "/exams", icon: AssignmentIcon, permission: "exams.create" },
      { label: "My Grading", to: "/exams/grading", icon: GradingIcon, permission: "exams.marks" },
      {
        label: "Class Comments",
        to: "/exams/comments",
        icon: DescriptionIcon,
        permission: "exams.marks",
      },
    ],
  },
  {
    heading: "Communication",
    items: [{ label: "Messages", to: "/messages", icon: MessageIcon, permission: "messages.view" }],
  },

  {
    heading: "Settings",
    items: [
      {
        label: "All Staff",
        to: "/users/staff",
        icon: BadgeIcon,
        permission: "staff.view",
        exact: true,
      },
      {
        label: "All Parents",
        to: "/users/parents",
        icon: EscalatorWarning,
        permission: "parents.view",
        exact: true,
      },
      {
        label: "User Management",
        to: "/settings/users",
        icon: ManageAccountsIcon,
        permission: "settings.view",
      },
    ],
  },
];

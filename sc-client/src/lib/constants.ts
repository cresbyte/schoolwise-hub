/**
 * Named constants and label maps for ShuleSmart.
 * @module constants
 */
import type {
  CBCRating,
  Curriculum,
  ExamType,
  FeeStatus,
  GradeLevel,
  LeaveType,
  PaymentMethod,
  StaffContractType,
  UserRole,
} from "./types";

export const HEADING_FONT = "'Merriweather', Georgia, serif";
export const BODY_FONT = "'Outfit', system-ui, -apple-system, sans-serif";

export const GRADE_LEVELS: GradeLevel[] = [
  "PP1",
  "PP2",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Form 1",
  "Form 2",
  "Form 3",
  "Form 4",
];

export const CBC_RATINGS: { value: CBCRating; label: string; descriptor: string }[] = [
  { value: "EE", label: "Exceeding Expectation", descriptor: "Exceeds the expected standard" },
  { value: "ME", label: "Meeting Expectation", descriptor: "Meets the expected standard" },
  { value: "AE", label: "Approaching Expectation", descriptor: "Approaching the expected standard" },
  { value: "BE", label: "Below Expectation", descriptor: "Below the expected standard" },
];

export const EXAM_TYPES: { value: ExamType; label: string }[] = [
  { value: "opener", label: "Opener Exam" },
  { value: "midterm", label: "Mid-Term Exam" },
  { value: "endterm", label: "End-Term Exam" },
  { value: "mock", label: "Mock Exam" },
  { value: "kcse", label: "KCSE" },
  { value: "assignment", label: "Assignment" },
];

export const FEE_STATUS: Record<FeeStatus, { label: string; color: string }> = {
  paid: { label: "Paid", color: "#2E7D32" },
  partial: { label: "Partial", color: "#F57F17" },
  unpaid: { label: "Unpaid", color: "#C62828" },
  overpaid: { label: "Overpaid", color: "#1565C0" },
};

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "mpesa", label: "M-Pesa" },
  { value: "cash", label: "Cash" },
  { value: "bank_cheque", label: "Bank Cheque" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  mpesa: "M-Pesa",
  cash: "Cash",
  bank_cheque: "Bank Cheque",
  bank_transfer: "Bank Transfer",
};

export const CONTRACT_TYPES: { value: StaffContractType; label: string }[] = [
  { value: "permanent", label: "Permanent" },
  { value: "tsc", label: "TSC" },
  { value: "bom", label: "BOM" },
  { value: "contract", label: "Contract" },
  { value: "intern", label: "Intern" },
];

export const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: "annual", label: "Annual Leave" },
  { value: "sick", label: "Sick Leave" },
  { value: "maternity", label: "Maternity Leave" },
  { value: "paternity", label: "Paternity Leave" },
  { value: "compassionate", label: "Compassionate Leave" },
  { value: "study", label: "Study Leave" },
];

export const CURRICULUM_LABELS: Record<Curriculum, string> = {
  CBC: "CBC",
  "844": "8-4-4",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  headteacher: "Head Teacher",
  class_teacher: "Class Teacher",
  teacher: "Teacher",
  accountant: "Accountant",
  parent: "Parent",
};

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: "#C62828",
  headteacher: "#6A1B9A",
  class_teacher: "#1565C0",
  teacher: "#0288D1",
  accountant: "#2E7D32",
  parent: "#F57F17",
};

export const ANNUAL_LEAVE_ENTITLEMENT = 30;
export const PERSONAL_RELIEF_MONTHLY = 2400;
export const PERSONAL_RELIEF_ANNUAL = 28800;

/** Permission map per role. "*" denotes wildcard within a module. */
export const PERMISSIONS: Record<UserRole, string[]> = {
  admin: ["*"],
  headteacher: [
    "students.*",
    "classes.*",
    "exams.*",
    "attendance.*",
    "staff.view",
    "reports.*",
    "timetable.*",
    "fees.view",
    "messages.send",
  ],
  class_teacher: [
    "students.view",
    "attendance.write",
    "exams.marks",
    "exams.view",
    "timetable.view",
    "reports.view",
    "classes.view",
  ],
  teacher: [
    "students.view",
    "exams.marks",
    "exams.view",
    "timetable.view",
    "classes.view",
  ],
  accountant: ["fees.*", "fees.view", "fees.write", "payroll.*", "payroll.view", "students.view", "reports.fees"],
  parent: ["portal.view"],
};

export const ROLE_HOME: Record<UserRole, string> = {
  admin: "/dashboard",
  headteacher: "/dashboard",
  class_teacher: "/dashboard",
  teacher: "/dashboard",
  accountant: "/fees/collection",
  parent: "/portal",
};

export const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

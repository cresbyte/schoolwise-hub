/**
 * Core domain types for ShuleSmart — Kenyan School Management System.
 * @module types
 */

export type UserRole = "admin" | "headteacher" | "class_teacher" | "accountant" | "parent";
export type Curriculum = "CBC" | "844";
export type Gender = "Male" | "Female";
export type TermNumber = 1 | 2 | 3;
export type GradeLevel =
  | "PP1"
  | "PP2"
  | "Grade 1"
  | "Grade 2"
  | "Grade 3"
  | "Grade 4"
  | "Grade 5"
  | "Grade 6"
  | "Grade 7"
  | "Grade 8"
  | "Grade 9"
  | "Form 1"
  | "Form 2"
  | "Form 3"
  | "Form 4";
export type CBCRating = "EE" | "ME" | "AE" | "BE";
export type AttendanceStatus = "present" | "absent" | "late" | "excused";
export type FeeStatus = "paid" | "partial" | "unpaid" | "overpaid";
export type PaymentMethod = "mpesa" | "cash" | "bank_cheque" | "bank_transfer";
export type ExamType = "opener" | "midterm" | "endterm" | "mock" | "kcse" | "assignment";
export type StaffContractType = "permanent" | "tsc" | "bom" | "contract" | "intern";
export type LeaveType =
  | "annual"
  | "sick"
  | "maternity"
  | "paternity"
  | "compassionate"
  | "study";
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
export type StudentStatus =
  | "active"
  | "transferred_out"
  | "graduated"
  | "expelled"
  | "deferred";
export type BoardingStatus = "day" | "boarding" | "part_boarding";

export interface User {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: string;
  email: string;
  phone: string;
  role: UserRole;
  photo?: string;
  studentId?: string; // keep for backward compat
  studentIds?: string[]; // primary: list of all children
  staffId?: string;
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
}

export interface School {
  id: string;
  name: string;
  motto?: string;
  registrationNumber: string;
  knecCode?: string;
  nemisCode?: string;
  postalAddress: string;
  physicalAddress: string;
  county: string;
  subCounty: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  principalName: string;
  curriculum: Curriculum[];
  mpesaPaybill?: string;
  mpesaTill?: string;
  smsSenderId?: string;
  currentTerm: TermNumber;
  currentYear: number;
  termStartDate: string;
  termEndDate: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  gradeLevel: GradeLevel;
  stream?: string;
  curriculum: Curriculum;
  classTeacherId?: string;
  classTeacherName?: string;
  capacity: number;
  studentCount: number;
  room?: string;
  academicYear: number;
}

export interface ParentInfo {
  fatherName?: string;
  fatherPhone?: string;
  fatherEmail?: string;
  fatherIdNumber?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherPhone?: string;
  motherEmail?: string;
  motherOccupation?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelationship?: string;
  guardianIdNumber?: string;
  primaryContactPhone: string;
  primaryContactName: string;
}

export interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  otherName?: string;
  gender: Gender;
  dateOfBirth: string;
  photo?: string;
  classId: string;
  className: string;
  gradeLevel: GradeLevel;
  curriculum: Curriculum;
  admissionDate: string;
  status: StudentStatus;
  nemisNumber?: string;
  birthCertNumber?: string;
  previousSchool?: string;
  specialNeeds?: string;
  parent: ParentInfo;
  homeLocation: string;
  boardingStatus: BoardingStatus;
  feeBalance: number;
  avatarUrl?: string;
}

export interface GradeRule {
  grade: string;
  min: number;
  max: number;
  color: string;
  comment?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  curriculum: Curriculum;
  gradeLevel: GradeLevel[];
  isCore: boolean;
  learningArea?: string;
  gradingSystem?: GradeRule[];
}

export interface ClassSubject {
  id: string;
  classId: string;
  subjectId: string;
  subjectName: string;
  teacherId?: string;
  teacherName?: string;
  periodsPerWeek: number;
}

export interface Staff {
  id: string;
  staffNumber: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string;
  phone: string;
  email?: string;
  photo?: string;
  idNumber: string;
  kraPin: string;
  nssfNumber?: string;
  shifNumber?: string;
  contractType: StaffContractType;
  designation: string;
  department?: string;
  subjectsTeaching?: string[];
  classAssigned?: string;
  dateJoined: string;
  status: "active" | "on_leave" | "suspended" | "terminated";
  basicSalary: number;
  houseAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  bankName?: string;
  bankAccount?: string;
  bankBranch?: string;
  nextOfKin: {
    name: string;
    relationship: string;
    phone: string;
    idNumber?: string;
  };
  avatarUrl?: string;
}

export interface Exam {
  id: string;
  name: string;
  type: ExamType;
  term: TermNumber;
  year: number;
  startDate: string;
  endDate: string;
  gradeLevel: GradeLevel[];
  outOf: number;
  status: "upcoming" | "ongoing" | "marking" | "completed" | "published";
  createdBy: string;
}

export interface ExamMark {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  marks: number | null;
  cbcRating?: CBCRating;
  grade?: string;
  color?: string;
  points?: number;
  teacherComment?: string;
  enteredBy: string;
  enteredAt: string;
}

export interface ReportCard {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  curriculum: Curriculum;
  term: TermNumber;
  year: number;
  examId: string;
   subjects: Array<{
    subjectId: string;
    subjectName: string;
    marks: number;
    grade: string;
    cbcRating?: CBCRating;
    teacherComment?: string;
    outOf: number;
    position?: number;
    color?: string;
  }>;
  totalMarks: number;
  average: number;
  position: number;
  classSize: number;
  classTeacherComment: string;
  principalComment: string;
  averageGrade?: string;
  averageGradeColor?: string;
  attendance: {
    daysPresent: number;
    daysAbsent: number;
    totalDays: number;
  };
  nextTermBegins: string;
  closingDate: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
  reason?: string;
  recordedBy: string;
  recordedAt: string;
  parentNotified: boolean;
}

export interface FeeItem {
  id: string;
  name: string;
  amount: number;
  isOptional: boolean;
  description?: string;
}

export interface FeeStructure {
  id: string;
  name: string;
  academicYear: number;
  term: TermNumber;
  gradeLevel: GradeLevel;
  boardingStatus: BoardingStatus | "all";
  items: FeeItem[];
  totalAmount: number;
  dueDate: string;
  status: "active" | "draft" | "archived";
}

export interface FeeInvoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  feeStructureId: string;
  term: TermNumber;
  year: number;
  items: Array<{ name: string; amount: number }>;
  totalCharged: number;
  totalPaid: number;
  balance: number;
  status: FeeStatus;
  dueDate: string;
  issuedDate: string;
}

export interface FeePayment {
  id: string;
  receiptNumber: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  invoiceId?: string;
  term: TermNumber;
  year: number;
  amount: number;
  paymentMethod: PaymentMethod;
  mpesaCode?: string;
  bankReference?: string;
  chequeNumber?: string;
  paymentDate: string;
  receivedBy: string;
  notes?: string;
  voidedAt?: string;
  voidedBy?: string;
  voidReason?: string;
}

export interface PayrollRecord {
  id: string;
  staffId: string;
  staffName: string;
  staffNumber: string;
  month: number;
  year: number;
  basicSalary: number;
  houseAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  grossPay: number;
  paye: number;
  nssf: number;
  shif: number;
  housingLevy: number;
  loanDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  paymentStatus: "draft" | "approved" | "paid";
  paymentDate?: string;
  paymentMethod?: "bank_transfer" | "mpesa" | "cash";
  processedBy: string;
  approvedBy?: string;
}

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  appliedOn: string;
  reviewedBy?: string;
  reviewedOn?: string;
  reviewNotes?: string;
  substituteStaffId?: string;
  substituteStaffName?: string;
}

export interface TimetableSlot {
  id: string;
  classId: string;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectId?: string;
  subjectName?: string;
  teacherId?: string;
  teacherName?: string;
  isBreak: boolean;
  breakName?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
  targetRole?: UserRole;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export type MessageChannel = "announcement" | "circular" | "direct" | "sms_alert";
export type MessageStatus = "draft" | "sent" | "read";
export type MessageRecipientType =
  | "all_parents"
  | "class_parents"
  | "individual_parent"
  | "all_staff"
  | "specific_staff";

export interface SchoolMessage {
  id: string;
  subject: string;
  body: string;
  channel: MessageChannel;
  recipientType: MessageRecipientType;
  classId?: string; // if class_parents
  className?: string;
  studentId?: string; // if individual_parent
  studentName?: string;
  parentName?: string;
  sentBy: string; // staff name
  sentById: string;
  sentAt: string;
  status: MessageStatus;
  readAt?: string;
  priority: "normal" | "urgent";
  attachmentLabel?: string; // e.g. "Term 2 Schedule.pdf" (display only, no real file)
}

export interface ParentReply {
  id: string;
  messageId: string;
  parentName: string;
  studentName: string;
  body: string;
  sentAt: string;
  readByStaff: boolean;
}

export type LevyScope = "class" | "grade" | "individual" | "all";
export type LevyStatus = "active" | "closed" | "cancelled";

export interface SpecialLevy {
  id: string;
  title: string;
  description: string;
  amount: number;
  scope: LevyScope;
  classId?: string;
  className?: string;
  gradeLevel?: string;
  studentIds?: string[];
  academicYear: number;
  term: TermNumber;
  dueDate: string;
  issuedDate: string;
  issuedBy: string;
  status: LevyStatus;
  category: "trip" | "kit" | "uniform" | "activity" | "stationery" | "other";
}

export interface LevyPayment {
  id: string;
  levyId: string;
  levyTitle: string;
  studentId: string;
  studentName: string;
  amount: number;
  paidAt: string;
  paymentMethod: PaymentMethod;
  mpesaCode?: string;
  receiptNumber: string;
  recordedBy: string;
}

export interface StudentLevyStatus {
  levy: SpecialLevy;
  paid: boolean;
  paidAt?: string;
  amountPaid?: number;
  receiptNumber?: string;
  waived: boolean;
  waivedReason?: string;
}
export type TermEventCategory =
  | "exam"          // opener, midterm, endterm, mock
  | "holiday"       // public holiday, half-term break
  | "closure"       // early closure day
  | "meeting"       // parents meeting, staff meeting
  | "activity"      // sports day, science fair, cultural day
  | "trip"          // educational trips (class-specific)
  | "deadline"      // fee payment deadline, form submission
  | "other";

export type TermEventScope = "school" | "grade" | "class";

export type ApprovalStatus = "draft" | "pending_approval" | "approved" | "rejected";

export interface TermEvent {
  id: string;
  title: string;
  description?: string;
  category: TermEventCategory;
  scope: TermEventScope;
  classId?: string;         // if scope === "class"
  className?: string;
  gradeLevel?: string;      // if scope === "grade"
  startDate: string;        // ISO date "2026-06-17"
  endDate: string;          // ISO date — same as startDate for single-day events
  isRange: boolean;         // true if startDate !== endDate
  term: TermNumber;
  year: number;
  visibleToParents: boolean;
  examId?: string;          // link to Exam if category === "exam"
  color?: string;           // optional override; defaults from category
  approvalStatus: ApprovalStatus;
  createdBy: string;        // userId
  createdByName: string;    // display name
  createdAt: string;
  reviewedBy?: string;      // userId of approver/rejecter
  reviewedByName?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}
export interface TeacherClassSummary {
  classId: string;
  className: string;
  studentCount: number;
  attendanceRate: number;
  averageMarks: number;
  unpaidFeesCount: number;
  upcomingExams: Exam[];
  topStudents: Array<{ id: string; name: string; mark: number }>;
}

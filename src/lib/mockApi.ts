/**
 * Mock API simulating async backend calls with an 800ms delay.
 * @module mockApi
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as db from "./mockData";
import type {
  AttendanceRecord,
  AuditLog,
  ClassRoom,
  ClassSubject,
  Exam,
  ExamMark,
  FeeInvoice,
  FeePayment,
  FeeStructure,
  LeaveRequest,
  LeaveStatus,
  AppNotification,
  PayrollRecord,
  ReportCard,
  School,
  Staff,
  Student,
  Subject,
  TimetableSlot,
  User,
  SchoolMessage,
  ParentReply,
  SpecialLevy,
  LevyPayment,
  StudentLevyStatus,
} from "./types";
import type {
  NewsArticle,
  GalleryItem,
  Testimonial,
  UpcomingEvent,
  HeroSlide,
  ContactSubmission,
  ApplicationSubmission,
  SchoolStat,
  WhyChooseUsItem,
} from "./website/data";
import {
  getNewsArticles, setNewsArticles,
  getGalleryItems, setGalleryItems,
  getTestimonials, setTestimonials,
  getUpcomingEvents, setUpcomingEvents,
  getHeroSlides, setHeroSlides,
  getContactSubmissions as getRawContactSubmissions, setContactSubmissions,
  getApplicationSubmissions, setApplicationSubmissions,
  getSchoolStats, setSchoolStats,
  getWhyChooseUs, setWhyChooseUs,
} from "./website/data";
import type { SchoolInfo } from "./website/constants";
import { getSchoolInfo, setSchoolInfo } from "./website/constants";
import { computePayroll, getCBCRating, getGrade, getGradeColor, getSubjectGrade } from "./utils";

const DELAY = 800;
function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), DELAY));
}
export function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

// Mutable in-memory stores
let students = clone(db.students);
let staff = clone(db.staff);
let classes = clone(db.classes);
let payments = clone(db.payments);
let feeStructures = clone(db.feeStructures);
let exams = clone(db.exams);
let examMarks = clone(db.examMarks);
let attendance = clone(db.attendance);
let leaveRequests = clone(db.leaveRequests);
let payroll = clone(db.payroll);
let users = clone(db.users);
let school = clone(db.school);
let notifications = clone(db.notifications);
const subjects = clone(db.subjects);
let classSubjects = clone(db.classSubjects);
let schoolMessages = clone(db.schoolMessages);
let parentReplies = clone(db.parentReplies);
let specialLevies = clone(db.specialLevies);
let levyPayments = clone(db.levyPayments);

const classTeacherCommentStore = new Map<string, string>();
let principalCommentTemplates = {
  strong: "A commendable result. Keep up the excellent work.",
  average: "Strive for improvement. We believe in your potential.",
};

// ---- Auth ----
export async function login(phone: string, password: string): Promise<{ user: User; token: string }> {
  const cred = db.credentials[phone];
  if (!cred || cred.password !== password) {
    return new Promise((_, reject) => setTimeout(() => reject(new Error("Invalid phone number or password")), DELAY));
  }
  const user = users.find((u) => u.id === cred.userId)!;
  return delay({ user, token: "mock-token-" + user.id });
}
export async function logout(): Promise<void> {
  return delay(undefined);
}

// ---- School ----
export async function getSchoolSettings(): Promise<School> {
  return delay(clone(school));
}
export async function updateSchoolSettings(data: Partial<School>): Promise<School> {
  school = { ...school, ...data };
  return delay(clone(school));
}

// ---- Parent Portal Helpers ----
export async function getParentStudents(userId: string): Promise<Student[]> {
  const user = users.find(u => u.id === userId);
  if (!user) return delay([]);
  const ids = user.studentIds ?? (user.studentId ? [user.studentId] : []);
  return delay(clone(students.filter(s => ids.includes(s.id))));
}

// ---- Students ----
export async function getStudents(filters?: {
  classId?: string;
  status?: string;
  search?: string;
  boardingStatus?: string;
}): Promise<Student[]> {
  let list = students;
  if (filters?.classId) list = list.filter((s) => s.classId === filters.classId);
  if (filters?.status && filters.status !== "all") list = list.filter((s) => s.status === filters.status);
  if (filters?.boardingStatus && filters.boardingStatus !== "all")
    list = list.filter((s) => s.boardingStatus === filters.boardingStatus);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (s) =>
        `${s.firstName} ${s.lastName} ${s.otherName ?? ""}`.toLowerCase().includes(q) ||
        s.admissionNumber.toLowerCase().includes(q) ||
        s.parent.primaryContactPhone.includes(q),
    );
  }
  return delay(clone(list));
}
export async function getStudentById(id: string): Promise<Student> {
  const s = students.find((x) => x.id === id);
  if (!s) throw new Error("Student not found");
  return delay(clone(s));
}
export async function createStudent(data: Student): Promise<Student> {
  const cls = classes.find((c) => c.id === data.classId);
  const student: Student = { ...data, id: "std-" + (students.length + 1), className: cls?.name ?? "", gradeLevel: cls?.gradeLevel ?? data.gradeLevel, curriculum: cls?.curriculum ?? data.curriculum };
  students = [student, ...students];
  return delay(clone(student));
}
export async function updateStudent(id: string, data: Partial<Student>): Promise<Student> {
  students = students.map((s) => (s.id === id ? { ...s, ...data } : s));
  return delay(clone(students.find((s) => s.id === id)!));
}
export async function updateStudentAvatar(id: string, photo: string): Promise<Student> {
  students = students.map((s) => (s.id === id ? { ...s, photo } : s));
  return delay(clone(students.find((s) => s.id === id)!));
}
export async function transferStudent(id: string, data: { reason?: string }): Promise<Student> {
  students = students.map((s) => (s.id === id ? { ...s, status: "transferred_out" } : s));
  return delay(clone(students.find((s) => s.id === id)!));
}
export async function getStudentsByClass(classId: string): Promise<Student[]> {
  return delay(clone(students.filter((s) => s.classId === classId)));
}
export async function importStudentsCSV(_file: File): Promise<{ success: number; failed: number; errors: string[] }> {
  return delay({ success: 12, failed: 2, errors: ["Row 5: missing admission number", "Row 9: invalid class"] });
}

// ---- Classes ----
export async function getClasses(): Promise<ClassRoom[]> {
  return delay(clone(classes));
}
export async function getClassById(id: string): Promise<ClassRoom> {
  const c = classes.find((x) => x.id === id);
  if (!c) throw new Error("Class not found");
  return delay(clone(c));
}
export async function createClass(data: ClassRoom): Promise<ClassRoom> {
  const cls = { ...data, id: "cls-" + (classes.length + 1), studentCount: 0 };
  classes = [...classes, cls];
  return delay(clone(cls));
}
export async function updateClass(id: string, data: Partial<ClassRoom>): Promise<ClassRoom> {
  classes = classes.map((c) => (c.id === id ? { ...c, ...data } : c));
  return delay(clone(classes.find((c) => c.id === id)!));
}
export async function getClassSubjects(filters?: {
  classId?: string;
  teacherId?: string;
  subjectId?: string;
}): Promise<ClassSubject[]> {
  let list = classSubjects;
  if (filters?.classId) list = list.filter((cs) => cs.classId === filters.classId);
  if (filters?.teacherId) list = list.filter((cs) => cs.teacherId === filters.teacherId);
  if (filters?.subjectId) list = list.filter((cs) => cs.subjectId === filters.subjectId);
  return delay(clone(list));
}
export async function updateClassSubject(id: string, patch: Partial<ClassSubject>): Promise<ClassSubject> {
  const idx = classSubjects.findIndex((cs) => cs.id === id);
  if (idx === -1) throw new Error("Assignment not found");
  const teacher = patch.teacherId ? staff.find((s) => s.id === patch.teacherId) : null;
  classSubjects[idx] = {
    ...classSubjects[idx],
    ...patch,
    teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : classSubjects[idx].teacherName,
  };
  return delay(clone(classSubjects[idx]));
}
export async function createClassSubject(data: Omit<ClassSubject, "id">): Promise<ClassSubject> {
  const teacher = data.teacherId ? staff.find((s) => s.id === data.teacherId) : null;
  const cs: ClassSubject = {
    ...data,
    id: "cs-" + Date.now(),
    teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : data.teacherName,
  };
  classSubjects.push(cs);
  return delay(clone(cs));
}
export async function getTeacherLoad(staffId: string): Promise<{ classSubjects: ClassSubject[]; totalPeriods: number }> {
  const load = classSubjects.filter((cs) => cs.teacherId === staffId);
  const totalPeriods = load.reduce((s, cs) => s + cs.periodsPerWeek, 0);
  return delay({ classSubjects: clone(load), totalPeriods });
}
export async function assignTeacherToSubject(classId: string, subjectId: string, teacherId: string): Promise<ClassSubject> {
  const cs = classSubjects.find((x) => x.classId === classId && x.subjectId === subjectId)!;
  const t = staff.find((s) => s.id === teacherId);
  cs.teacherId = teacherId;
  cs.teacherName = t ? `${t.firstName} ${t.lastName}` : cs.teacherName;
  return delay(clone(cs));
}

// ---- Subjects ----
export async function getSubjects(filters?: { curriculum?: string; gradeLevel?: string }): Promise<Subject[]> {
  let list = subjects;
  if (filters?.curriculum) list = list.filter((s) => s.curriculum === filters.curriculum);
  if (filters?.gradeLevel) list = list.filter((s) => s.gradeLevel.includes(filters.gradeLevel as any));
  return delay(clone(list));
}
export async function createSubject(data: Subject): Promise<Subject> {
  const sub = { ...data, id: "sub-" + Date.now() };
  subjects.push(sub);
  return delay(clone(sub));
}
export async function getSubjectById(id: string): Promise<Subject> {
  const s = subjects.find(x => x.id === id);
  if (!s) throw new Error("Subject not found");
  return delay(clone(s));
}
export async function updateSubject(id: string, data: Partial<Subject>): Promise<Subject> {
  const idx = subjects.findIndex(s => s.id === id);
  if (idx === -1) throw new Error("Subject not found");
  subjects[idx] = { ...subjects[idx], ...data };
  return delay(clone(subjects[idx]));
}

// ---- Staff ----
export async function getStaff(filters?: { status?: string; department?: string; search?: string }): Promise<Staff[]> {
  let list = staff;
  if (filters?.status && filters.status !== "all") list = list.filter((s) => s.status === filters.status);
  if (filters?.department && filters.department !== "all") list = list.filter((s) => s.department === filters.department);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter((s) => `${s.firstName} ${s.lastName} ${s.staffNumber}`.toLowerCase().includes(q));
  }
  return delay(clone(list));
}
export async function getStaffById(id: string): Promise<Staff> {
  const s = staff.find((x) => x.id === id);
  if (!s) throw new Error("Staff not found");
  return delay(clone(s));
}
export async function createStaff(data: Staff): Promise<Staff> {
  const s: Staff = { ...data, id: "stf-" + (staff.length + 1) };
  
  // Sync Class Teacher status
  const classSuffix = " Class Teacher";
  if (s.designation.endsWith(classSuffix)) {
    const className = s.designation.replace(classSuffix, "");
    const classRoom = classes.find(c => c.name === className);
    if (classRoom) {
      classRoom.classTeacherId = s.id;
      classRoom.classTeacherName = `${s.firstName} ${s.lastName}`;
    }
  }

  staff = [...staff, s];
  return delay(clone(s));
}
export async function updateStaff(id: string, data: Partial<Staff>): Promise<Staff> {
  const oldStaff = staff.find(s => s.id === id);
  
  // Sync Class Teacher status if designation changes
  if (data.designation && oldStaff && data.designation !== oldStaff.designation) {
    const classSuffix = " Class Teacher";
    
    // Clear old class assignment if it was a Class Teacher role
    if (oldStaff.designation.endsWith(classSuffix)) {
      const oldClassName = oldStaff.designation.replace(classSuffix, "");
      const oldClass = classes.find(c => c.name === oldClassName);
      if (oldClass && oldClass.classTeacherId === id) {
        oldClass.classTeacherId = undefined;
        oldClass.classTeacherName = undefined;
      }
    }

    // Set new class assignment if it's a Class Teacher role
    if (data.designation.endsWith(classSuffix)) {
      const newClassName = data.designation.replace(classSuffix, "");
      const newClass = classes.find(c => c.name === newClassName);
      if (newClass) {
        // If someone else was the teacher, clear their designation (to maintain uniqueness)
        if (newClass.classTeacherId && newClass.classTeacherId !== id) {
          const otherTeacher = staff.find(s => s.id === newClass.classTeacherId);
          if (otherTeacher) {
            otherTeacher.designation = "Teacher"; // Fallback
          }
        }
        newClass.classTeacherId = id;
        newClass.classTeacherName = `${data.firstName || oldStaff.firstName} ${data.lastName || oldStaff.lastName}`;
      }
    }
  }

  staff = staff.map((s) => (s.id === id ? { ...s, ...data } : s));
  return delay(clone(staff.find((s) => s.id === id)!));
}
export async function getLeaveRequests(filters?: { staffId?: string; status?: string }): Promise<LeaveRequest[]> {
  let list = leaveRequests;
  if (filters?.staffId) list = list.filter((l) => l.staffId === filters.staffId);
  if (filters?.status && filters.status !== "all") list = list.filter((l) => l.status === filters.status);
  return delay(clone(list));
}
export async function createLeaveRequest(data: LeaveRequest): Promise<LeaveRequest> {
  const lv = { ...data, id: "lv-" + (leaveRequests.length + 1), status: "pending" as LeaveStatus, appliedOn: new Date().toISOString() };
  leaveRequests = [lv, ...leaveRequests];
  return delay(clone(lv));
}
export async function updateLeaveStatus(id: string, status: LeaveStatus, notes?: string): Promise<LeaveRequest> {
  leaveRequests = leaveRequests.map((l) =>
    l.id === id ? { ...l, status, reviewNotes: notes, reviewedOn: new Date().toISOString(), reviewedBy: "Admin" } : l,
  );
  return delay(clone(leaveRequests.find((l) => l.id === id)!));
}

export async function getDesignations(staffId?: string): Promise<{ label: string; isUnique: boolean; isTaken: boolean }[]> {
  const standard = [
    { label: "Principal", isUnique: true, isTaken: false },
    { label: "Deputy Principal", isUnique: true, isTaken: false },
    { label: "Accountant", isUnique: false, isTaken: false },
    { label: "Secretary", isUnique: false, isTaken: false },
    { label: "Mathematics Teacher", isUnique: false, isTaken: false },
    { label: "English Teacher", isUnique: false, isTaken: false },
    { label: "Kiswahili Teacher", isUnique: false, isTaken: false },
    { label: "Science Teacher", isUnique: false, isTaken: false },
    { label: "Teacher", isUnique: false, isTaken: false },
  ];

  const classRoles = classes.map(c => {
    const label = `${c.name} Class Teacher`;
    const takenBy = staff.find(s => s.designation === label);
    return {
      label,
      isUnique: true,
      isTaken: takenBy ? takenBy.id !== staffId : false
    };
  });

  // Mark standard unique roles as taken if they are
  standard.forEach(s => {
    if (s.isUnique) {
      const takenBy = staff.find(st => st.designation === s.label);
      s.isTaken = takenBy ? takenBy.id !== staffId : false;
    }
  });

  return delay([...standard, ...classRoles]);
}

// ---- Messaging ----
export async function getMessages(filters?: {
  recipientType?: string;
  classId?: string;
  studentId?: string;
  status?: string;
}): Promise<SchoolMessage[]> {
  let list = schoolMessages;
  if (filters?.recipientType) list = list.filter((m) => m.recipientType === filters.recipientType);
  if (filters?.classId) list = list.filter((m) => m.classId === filters.classId);
  if (filters?.studentId) list = list.filter((m) => m.studentId === filters.studentId);
  if (filters?.status) list = list.filter((m) => m.status === filters.status);
  return delay(clone(list).sort((a, b) => b.sentAt.localeCompare(a.sentAt)));
}
export async function getParentMessages(studentId: string): Promise<SchoolMessage[]> {
  const student = students.find((s) => s.id === studentId);
  if (!student) return delay([]);
  const list = schoolMessages.filter(
    (m) =>
      m.recipientType === "all_parents" ||
      (m.recipientType === "class_parents" && m.classId === student.classId) ||
      (m.recipientType === "individual_parent" && m.studentId === studentId),
  );
  return delay(clone(list).sort((a, b) => b.sentAt.localeCompare(a.sentAt)));
}
export async function sendMessage(data: Omit<SchoolMessage, "id" | "sentAt" | "status">): Promise<SchoolMessage> {
  const msg: SchoolMessage = {
    ...data,
    id: "msg-" + Date.now(),
    sentAt: new Date().toISOString(),
    status: "sent",
  };
  schoolMessages.push(msg);
  return delay(clone(msg));
}
export async function getParentReplies(filters?: { messageId?: string; readByStaff?: boolean }): Promise<ParentReply[]> {
  let list = parentReplies;
  if (filters?.messageId) list = list.filter((r) => r.messageId === filters.messageId);
  if (filters?.readByStaff !== undefined) list = list.filter((r) => r.readByStaff === filters.readByStaff);
  return delay(clone(list).sort((a, b) => b.sentAt.localeCompare(a.sentAt)));
}
export async function sendParentReply(data: Omit<ParentReply, "id" | "sentAt" | "readByStaff">): Promise<ParentReply> {
  const reply: ParentReply = {
    ...data,
    id: "rep-" + Date.now(),
    sentAt: new Date().toISOString(),
    readByStaff: false,
  };
  parentReplies.push(reply);
  return delay(clone(reply));
}
export async function markMessageRead(id: string): Promise<void> {
  const idx = schoolMessages.findIndex((m) => m.id === id);
  if (idx !== -1) schoolMessages[idx].status = "read";
  return delay(undefined);
}
export async function markReplyRead(id: string): Promise<void> {
  const idx = parentReplies.findIndex((r) => r.id === id);
  if (idx !== -1) parentReplies[idx].readByStaff = true;
  return delay(undefined);
}

// ---- Exams & Marks ----
export async function getExams(filters?: { term?: number; year?: number; type?: string; status?: string }): Promise<Exam[]> {
  let list = exams;
  if (filters?.term) list = list.filter((e) => e.term === filters.term);
  if (filters?.year) list = list.filter((e) => e.year === filters.year);
  if (filters?.type && filters.type !== "all") list = list.filter((e) => e.type === filters.type);
  if (filters?.status && filters.status !== "all") list = list.filter((e) => e.status === filters.status);
  return delay(clone(list));
}
export async function getExamById(id: string): Promise<Exam> {
  const e = exams.find((x) => x.id === id);
  if (!e) throw new Error("Exam not found");
  return delay(clone(e));
}
export async function createExam(data: Exam): Promise<Exam> {
  const e = { ...data, id: "exm-" + (exams.length + 1), status: "upcoming" as const };
  exams = [...exams, e];
  return delay(clone(e));
}
export async function getExamMarks(examId: string, classId: string): Promise<ExamMark[]> {
  return delay(clone(examMarks.filter((m) => m.examId === examId && m.classId === classId)));
}
export async function saveExamMarks(examId: string, classId: string, marks: ExamMark[]): Promise<{ saved: number }> {
  examMarks = examMarks.filter((m) => !(m.examId === examId && m.classId === classId));
  examMarks.push(...marks.map((m) => ({ ...m, grade: m.marks != null ? getGrade(m.marks) : undefined })));
  return delay({ saved: marks.length });
}
export async function publishExamResults(examId: string): Promise<Exam> {
  exams = exams.map((e) => (e.id === examId ? { ...e, status: "published" } : e));
  return delay(clone(exams.find((e) => e.id === examId)!));
}



export async function saveClassTeacherComments(
  examId: string,
  classId: string,
  comments: { studentId: string; comment: string }[],
): Promise<void> {
  for (const item of comments) {
    classTeacherCommentStore.set(`${examId}:${classId}:${item.studentId}`, item.comment);
  }
  return delay(undefined);
}
export async function savePrincipalCommentTemplates(strong: string, average: string): Promise<void> {
  principalCommentTemplates = { strong, average };
  return delay(undefined);
}

function buildReportCard(studentId: string, examId: string): ReportCard {
  const student = students.find((s) => s.id === studentId)!;
  const marks = examMarks.filter((m) => m.examId === examId && m.studentId === studentId);
  const subjectsRc = marks.map((m) => {
    const subject = subjects.find(s => s.id === m.subjectId);
    const { grade, color } = getSubjectGrade(m.marks ?? 0, subject);
    return {
      subjectId: m.subjectId,
      subjectName: m.subjectName,
      marks: m.marks ?? 0,
      grade: m.grade || grade,
      color: color || getGradeColor(m.grade || grade, subject),
      cbcRating: m.cbcRating ?? (student.curriculum === "CBC" ? getCBCRating(m.marks ?? 0) : undefined),
      teacherComment: m.teacherComment,
      outOf: 100,
    };
  });
  const totalMarks = subjectsRc.reduce((s, x) => s + x.marks, 0);
  const average = subjectsRc.length ? Math.round(totalMarks / subjectsRc.length) : 0;
  const { grade: avgGrade, color: avgColor } = getSubjectGrade(average);
  const classmates = students.filter((s) => s.classId === student.classId);
  const ranks = classmates
    .map((c) => {
      const cm = examMarks.filter((m) => m.examId === examId && m.studentId === c.id);
      return { id: c.id, total: cm.reduce((s, x) => s + (x.marks ?? 0), 0) };
    })
    .sort((a, b) => b.total - a.total);
  const position = ranks.findIndex((r) => r.id === studentId) + 1;

  const savedComment = classTeacherCommentStore.get(`${examId}:${student.classId}:${studentId}`);
  const defaultComment =
    average >= 70
      ? "Excellent performance. Keep it up!"
      : average >= 50
        ? "Good effort. Aim higher next term."
        : "Needs to work harder. More focus required.";

  return {
    studentId,
    studentName: `${student.firstName} ${student.lastName}`,
    admissionNumber: student.admissionNumber,
    className: student.className,
    curriculum: student.curriculum,
    term: 2,
    year: 2026,
    examId,
    subjects: subjectsRc,
    totalMarks,
    average,
    position,
    classSize: classmates.length,
    averageGrade: avgGrade,
    averageGradeColor: avgColor,
    classTeacherComment: savedComment || defaultComment,
    principalComment: average >= 70 ? principalCommentTemplates.strong : principalCommentTemplates.average,
    attendance: { daysPresent: 58, daysAbsent: 2, totalDays: 60 },
    nextTermBegins: "2026-09-02",
    closingDate: "2026-08-09",
  };
}

export async function generateReportCards(examId: string, classId: string): Promise<ReportCard[]> {
  const list = students.filter((s) => s.classId === classId).map((s) => buildReportCard(s.id, examId));
  list.sort((a, b) => a.position - b.position);
  return delay(clone(list));
}
export async function getStudentReportCard(studentId: string, examId: string): Promise<ReportCard> {
  return delay(clone(buildReportCard(studentId, examId)));
}

// ---- Attendance ----
export async function getAttendance(classId: string, date: string): Promise<AttendanceRecord[]> {
  return delay(clone(attendance.filter((a) => a.classId === classId && a.date === date)));
}
export async function getAttendanceRange(classId: string, startDate: string, endDate: string): Promise<AttendanceRecord[]> {
  return delay(clone(attendance.filter((a) => a.classId === classId && a.date >= startDate && a.date <= endDate)));
}
export async function saveAttendance(classId: string, date: string, records: AttendanceRecord[]): Promise<{ saved: number }> {
  attendance = attendance.filter((a) => !(a.classId === classId && a.date === date));
  attendance.push(...records);

  // Feature 3B: Auto-notification for absences
  const absences = records.filter((r) => r.status === "absent");
  for (const r of absences) {
    const student = students.find((s) => s.id === r.studentId);
    if (student) {
      sendMessage({
        subject: "Absence Alert",
        body: `Dear ${student.parent.primaryContactName}, ${student.firstName} was marked absent on ${date}. Please contact the school if this is unexpected.`,
        channel: "sms_alert",
        recipientType: "individual_parent",
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        parentName: student.parent.primaryContactName,
        sentBy: "Attendance System",
        sentById: "system",
        priority: "normal",
      });
    }
  }

  return delay({ saved: records.length });
}
export async function saveAttendanceBulk(records: AttendanceRecord[]): Promise<{ saved: number }> {
  // Replace each record by id if exists, or append
  const ids = new Set(records.map((r) => r.id));
  attendance = attendance.filter((a) => !ids.has(a.id));
  attendance.push(...records);
  return delay({ saved: records.length });
}
export async function getAttendanceSummary(classId: string, dateFrom: string, dateTo: string): Promise<any> {
  const recs = attendance.filter((a) => a.classId === classId && a.date >= dateFrom && a.date <= dateTo);
  const byStudent: Record<string, { name: string; present: number; absent: number; late: number; total: number }> = {};
  for (const r of recs) {
    byStudent[r.studentId] ??= { name: r.studentName, present: 0, absent: 0, late: 0, total: 0 };
    byStudent[r.studentId].total++;
    if (r.status === "present") byStudent[r.studentId].present++;
    if (r.status === "absent") byStudent[r.studentId].absent++;
    if (r.status === "late") byStudent[r.studentId].late++;
  }
  return delay(Object.entries(byStudent).map(([id, v]) => ({ studentId: id, ...v, percentage: v.total ? Math.round(((v.present + v.late) / v.total) * 100) : 0 })));
}
export async function getStudentAttendance(studentId: string, dateFrom: string, dateTo: string): Promise<AttendanceRecord[]> {
  return delay(clone(attendance.filter((a) => a.studentId === studentId && a.date >= dateFrom && a.date <= dateTo)));
}

// ---- Fees ----
export async function getFeeStructures(filters?: { year?: number; term?: number; gradeLevel?: string }): Promise<FeeStructure[]> {
  let list = feeStructures;
  if (filters?.year) list = list.filter((f) => f.academicYear === filters.year);
  if (filters?.term) list = list.filter((f) => f.term === filters.term);
  return delay(clone(list));
}
export async function createFeeStructure(data: FeeStructure): Promise<FeeStructure> {
  const f = { ...data, id: "fs-" + (feeStructures.length + 1) };
  feeStructures = [...feeStructures, f];
  return delay(clone(f));
}
export async function updateFeeStructure(id: string, data: Partial<FeeStructure>): Promise<FeeStructure> {
  feeStructures = feeStructures.map((f) => (f.id === id ? { ...f, ...data } : f));
  return delay(clone(feeStructures.find((f) => f.id === id)!));
}
function invoiceFor(student: Student): FeeInvoice {
  const charged = student.gradeLevel.startsWith("Form") ? 18000 : student.gradeLevel.startsWith("Grade 7") || student.gradeLevel.startsWith("Grade 8") ? 15000 : 12500;
  const boardingExtra = student.boardingStatus === "boarding" ? 22000 : 0;
  const total = charged + boardingExtra;
  const paid = Math.max(0, total - student.feeBalance);
  return {
    id: "inv-" + student.id,
    invoiceNumber: `INV-2026-T2-${student.admissionNumber.slice(-5)}`,
    studentId: student.id,
    studentName: `${student.firstName} ${student.lastName}`,
    admissionNumber: student.admissionNumber,
    className: student.className,
    feeStructureId: "fs-1",
    term: 2,
    year: 2026,
    items: [
      { name: "Tuition", amount: charged - 3000 },
      { name: "Activity Fee", amount: 1500 },
      { name: "Exam Fee", amount: 1500 },
      ...(boardingExtra ? [{ name: "Boarding & Meals", amount: boardingExtra }] : []),
    ],
    totalCharged: total,
    totalPaid: paid,
    balance: student.feeBalance,
    status: student.feeBalance <= 0 ? (student.feeBalance < 0 ? "overpaid" : "paid") : paid > 0 ? "partial" : "unpaid",
    dueDate: "2026-05-31",
    issuedDate: "2026-05-06",
  };
}
export async function getStudentInvoice(studentId: string): Promise<FeeInvoice> {
  const s = students.find((x) => x.id === studentId)!;
  return delay(clone(invoiceFor(s)));
}
export async function getAllInvoices(filters?: { classId?: string; status?: string }): Promise<FeeInvoice[]> {
  let list = students;
  if (filters?.classId) list = list.filter((s) => s.classId === filters.classId);
  let invoices = list.map(invoiceFor);
  if (filters?.status && filters.status !== "all") invoices = invoices.filter((i) => i.status === filters.status);
  return delay(clone(invoices));
}
export async function recordPayment(data: Partial<FeePayment>): Promise<FeePayment> {
  const student = students.find((s) => s.id === data.studentId)!;
  const pay: FeePayment = {
    id: "pay-" + Date.now(),
    receiptNumber: `RCP-2026-${String(900 + payments.length).padStart(5, "0")}`,
    studentId: student.id,
    studentName: `${student.firstName} ${student.lastName}`,
    admissionNumber: student.admissionNumber,
    className: student.className,
    term: 2,
    year: 2026,
    amount: data.amount ?? 0,
    paymentMethod: data.paymentMethod ?? "cash",
    mpesaCode: data.mpesaCode,
    bankReference: data.bankReference,
    chequeNumber: data.chequeNumber,
    paymentDate: data.paymentDate ?? new Date().toISOString().slice(0, 10),
    receivedBy: data.receivedBy ?? "Accountant",
    notes: data.notes,
  };
  payments = [pay, ...payments];
  students = students.map((s) => (s.id === student.id ? { ...s, feeBalance: s.feeBalance - (data.amount ?? 0) } : s));
  return delay(clone(pay));
}
export async function getPayments(filters?: { studentId?: string; method?: string; search?: string }): Promise<FeePayment[]> {
  let list = payments;
  if (filters?.studentId) list = list.filter((p) => p.studentId === filters.studentId);
  if (filters?.method && filters.method !== "all") list = list.filter((p) => p.paymentMethod === filters.method);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter((p) => p.studentName.toLowerCase().includes(q) || p.receiptNumber.toLowerCase().includes(q));
  }
  return delay(clone(list));
}
export async function voidPayment(id: string, reason: string): Promise<FeePayment> {
  payments = payments.map((p) => (p.id === id ? { ...p, voidedAt: new Date().toISOString(), voidedBy: "Admin", voidReason: reason } : p));
  return delay(clone(payments.find((p) => p.id === id)!));
}
export async function getOutstandingFees(filters?: { classId?: string }): Promise<FeeInvoice[]> {
  let list = students.filter((s) => s.feeBalance > 0);
  if (filters?.classId) list = list.filter((s) => s.classId === filters.classId);
  return delay(clone(list.map(invoiceFor).sort((a, b) => b.balance - a.balance)));
}
export async function getFeeCollectionSummary(): Promise<any> {
  const invoices = students.map(invoiceFor);
  const totalCharged = invoices.reduce((s, i) => s + i.totalCharged, 0);
  const totalCollected = invoices.reduce((s, i) => s + i.totalPaid, 0);
  const outstanding = invoices.reduce((s, i) => s + Math.max(0, i.balance), 0);
  const byClass = classes.map((c) => {
    const cls = invoices.filter((i) => i.className === c.name);
    const charged = cls.reduce((s, i) => s + i.totalCharged, 0);
    const collected = cls.reduce((s, i) => s + i.totalPaid, 0);
    return {
      classId: c.id,
      className: c.name,
      students: cls.length,
      charged,
      collected,
      outstanding: charged - collected,
      rate: charged ? Math.round((collected / charged) * 100) : 0,
    };
  });
  return delay({
    totalCharged,
    totalCollected,
    outstanding,
    rate: totalCharged ? Math.round((totalCollected / totalCharged) * 100) : 0,
    studentsWithBalance: invoices.filter((i) => i.balance > 0).length,
    fullyPaid: invoices.filter((i) => i.balance <= 0).length,
    byClass,
  });
}

// ---- Payroll ----
export async function getPayroll(month: number, year: number): Promise<PayrollRecord[]> {
  return delay(clone(payroll.filter((p) => p.month === month && p.year === year)));
}
export async function calculatePayroll(month: number, year: number): Promise<PayrollRecord[]> {
  if (!payroll.some((p) => p.month === month && p.year === year)) {
    const records = staff.map((s) => {
      const c = computePayroll(s.basicSalary, s.houseAllowance, s.transportAllowance, s.otherAllowances);
      return {
        id: `pr-${month}-${s.id}`,
        staffId: s.id,
        staffName: `${s.firstName} ${s.lastName}`,
        staffNumber: s.staffNumber,
        month,
        year,
        basicSalary: s.basicSalary,
        houseAllowance: s.houseAllowance,
        transportAllowance: s.transportAllowance,
        otherAllowances: s.otherAllowances,
        ...c,
        loanDeduction: 0,
        otherDeductions: 0,
        paymentStatus: "draft" as const,
        processedBy: "Ms. Agnes Njoki Kariuki",
      };
    });
    payroll = [...payroll, ...records];
  }
  return delay(clone(payroll.filter((p) => p.month === month && p.year === year)));
}
export async function approvePayroll(month: number, year: number): Promise<{ approved: number }> {
  let n = 0;
  payroll = payroll.map((p) => (p.month === month && p.year === year ? ((n++), { ...p, paymentStatus: "approved" }) : p));
  return delay({ approved: n });
}
export async function markPayrollPaid(month: number, year: number): Promise<{ paid: number }> {
  let n = 0;
  payroll = payroll.map((p) =>
    p.month === month && p.year === year ? ((n++), { ...p, paymentStatus: "paid", paymentDate: new Date().toISOString().slice(0, 10), paymentMethod: "bank_transfer" }) : p,
  );
  return delay({ paid: n });
}
export async function getStaffPayslip(staffId: string, month: number, year: number): Promise<PayrollRecord> {
  const p = payroll.find((x) => x.staffId === staffId && x.month === month && x.year === year);
  if (!p) throw new Error("Payslip not found");
  return delay(clone(p));
}
export async function getStaffPayrollHistory(staffId: string): Promise<PayrollRecord[]> {
  return delay(clone(payroll.filter((p) => p.staffId === staffId).sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month))));
}
export async function updateStaffAvatar(staffId: string, photo: string): Promise<Staff> {
  staff = staff.map((s) => (s.id === staffId ? { ...s, photo } : s));
  users = users.map((u) => (u.staffId === staffId ? { ...u, avatar: photo } : u));
  return delay(clone(staff.find((s) => s.id === staffId)!));
}
export async function getP9Certificate(staffId: string, year: number): Promise<any> {
  const s = staff.find((x) => x.id === staffId)!;
  const c = computePayroll(s.basicSalary, s.houseAllowance, s.transportAllowance, s.otherAllowances);
  const months = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, gross: c.grossPay, paye: c.paye, nssf: c.nssf }));
  return delay({
    staff: clone(s),
    year,
    months,
    annualGross: c.grossPay * 12,
    annualPaye: c.paye * 12,
    personalRelief: 28800,
  });
}

// ---- Timetable ----
export async function getTimetable(classId: string): Promise<TimetableSlot[]> {
  return delay(clone(db.timetables[classId] ?? db.timetables["cls-7"].map((s) => ({ ...s, classId }))));
}
export async function getTeacherTimetable(staffId: string): Promise<TimetableSlot[]> {
  const all = Object.values(db.timetables).flat();
  return delay(clone(all.filter((s) => s.teacherId === staffId)));
}
export async function saveTimetable(classId: string, slots: TimetableSlot[]): Promise<TimetableSlot[]> {
  db.timetables[classId] = clone(slots);
  return delay(clone(slots));
}
export async function generateAutoTimetable(classId: string): Promise<TimetableSlot[]> {
  return new Promise((resolve) => setTimeout(() => resolve(clone(db.timetables["cls-7"].map((s) => ({ ...s, classId })))), 2000));
}

// ---- Reports ----
export async function getNEMISExport(): Promise<any> {
  return delay(
    clone(
      students.map((s) => ({
        admissionNumber: s.admissionNumber,
        nemisNumber: s.nemisNumber,
        firstName: s.firstName,
        lastName: s.lastName,
        gender: s.gender,
        dateOfBirth: s.dateOfBirth,
        class: s.className,
        parentName: s.parent.primaryContactName,
        parentPhone: s.parent.primaryContactPhone,
      })),
    ),
  );
}
export async function getSchoolPerformanceTrend(): Promise<any> {
  return delay([
    { term: "T1 2023", average: 58, highest: 88, lowest: 31 },
    { term: "T2 2023", average: 61, highest: 91, lowest: 33 },
    { term: "T3 2023", average: 64, highest: 92, lowest: 35 },
    { term: "T1 2026", average: 66, highest: 94, lowest: 38 },
    { term: "T2 2026", average: 68, highest: 95, lowest: 40 },
  ]);
}
export async function getClassPerformanceReport(classId: string, examId: string): Promise<any> {
  const marks = examMarks.filter((m) => m.classId === classId && m.examId === examId);
  const bySubject: Record<string, number[]> = {};
  for (const m of marks) {
    bySubject[m.subjectName] ??= [];
    if (m.marks != null) bySubject[m.subjectName].push(m.marks);
  }
  const subjectStats = Object.entries(bySubject).map(([name, arr]) => ({
    subject: name,
    average: arr.length ? Math.round(arr.reduce((s, x) => s + x, 0) / arr.length) : 0,
    highest: Math.max(...arr, 0),
    lowest: Math.min(...arr, 100),
    passRate: arr.length ? Math.round((arr.filter((x) => x >= 50).length / arr.length) * 100) : 0,
  }));
  const reportCards = await generateReportCards(examId, classId);
  return delay({ subjectStats, reportCards });
}
export async function getKNEC7Best(classId: string, examId: string): Promise<any> {
  const reportCards = students.filter((s) => s.classId === classId).map((s) => buildReportCard(s.id, examId));
  const result = reportCards.map((rc) => {
    const sorted = [...rc.subjects].sort((a, b) => b.marks - a.marks).slice(0, 7);
    return { studentName: rc.studentName, subjects: sorted, best7Total: sorted.reduce((s, x) => s + x.marks, 0) };
  });
  result.sort((a, b) => b.best7Total - a.best7Total);
  return delay(result);
}

// ---- Users ----
export async function getUsers(): Promise<User[]> {
  return delay(clone(users));
}
export async function createUser(data: User): Promise<User> {
  const u = { ...data, id: "usr-" + (users.length + 1), isActive: true, createdAt: new Date().toISOString(), lastLogin: "" };
  users = [...users, u];
  return delay(clone(u));
}
export async function updateUser(id: string, data: Partial<User>): Promise<User> {
  users = users.map((u) => (u.id === id ? { ...u, ...data } : u));
  return delay(clone(users.find((u) => u.id === id)!));
}
export async function deactivateUser(id: string): Promise<User> {
  users = users.map((u) => (u.id === id ? { ...u, isActive: false } : u));
  return delay(clone(users.find((u) => u.id === id)!));
}

// ---- Audit ----
export async function getAuditLogs(): Promise<AuditLog[]> {
  return delay(clone(db.auditLogs));
}

// ---- Notifications ----
export async function getNotifications(): Promise<AppNotification[]> {
  return delay(clone(notifications));
}
export async function markNotificationRead(id: string): Promise<void> {
  notifications = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
  return delay(undefined);
}

// ---- CMS Website ----

const CMS_DELAY = 300;
function cmsDelay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), CMS_DELAY));
}
function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function genId(): string {
  return "cms-" + Date.now();
}

// ---- CMS: News Articles ----
export async function getCmsNews(): Promise<NewsArticle[]> {
  return cmsDelay(clone(getNewsArticles()));
}
export async function createNewsArticle(data: Omit<NewsArticle, "slug">): Promise<NewsArticle> {
  const article: NewsArticle = { ...data, slug: slugify(data.title) };
  setNewsArticles([article, ...getNewsArticles()]);
  return cmsDelay(clone(article));
}
export async function updateNewsArticle(slug: string, patch: Partial<NewsArticle>): Promise<NewsArticle> {
  const articles = getNewsArticles();
  const updated = articles.map((a) =>
    a.slug === slug ? { ...a, ...patch, slug: patch.title ? slugify(patch.title) : a.slug } : a
  );
  setNewsArticles(updated);
  const newSlug = patch.title ? slugify(patch.title) : slug;
  return cmsDelay(clone(updated.find((a) => a.slug === newSlug)!));
}
export async function deleteNewsArticle(slug: string): Promise<void> {
  setNewsArticles(getNewsArticles().filter((a) => a.slug !== slug));
  return cmsDelay(undefined);
}

// ---- CMS: Gallery ----
export async function getCmsGallery(): Promise<GalleryItem[]> {
  return cmsDelay(clone(getGalleryItems()));
}
export async function createGalleryItem(data: Omit<GalleryItem, "id">): Promise<GalleryItem> {
  const item: GalleryItem = { ...data, id: genId() };
  setGalleryItems([item, ...getGalleryItems()]);
  return cmsDelay(clone(item));
}
export async function updateGalleryItem(id: string, patch: Partial<GalleryItem>): Promise<GalleryItem> {
  const items = getGalleryItems();
  const updated = items.map((g) => (g.id === id ? { ...g, ...patch } : g));
  setGalleryItems(updated);
  return cmsDelay(clone(updated.find((g) => g.id === id)!));
}
export async function deleteGalleryItem(id: string): Promise<void> {
  setGalleryItems(getGalleryItems().filter((g) => g.id !== id));
  return cmsDelay(undefined);
}

// ---- CMS: Testimonials ----
export async function getCmsTestimonials(): Promise<Testimonial[]> {
  return cmsDelay(clone(getTestimonials()));
}
export async function createTestimonial(data: Omit<Testimonial, "id">): Promise<Testimonial> {
  const item: Testimonial = { ...data, id: genId() };
  setTestimonials([...getTestimonials(), item]);
  return cmsDelay(clone(item));
}
export async function updateTestimonial(id: string, patch: Partial<Testimonial>): Promise<Testimonial> {
  const list = getTestimonials();
  const updated = list.map((t) => (t.id === id ? { ...t, ...patch } : t));
  setTestimonials(updated);
  return cmsDelay(clone(updated.find((t) => t.id === id)!));
}
export async function deleteTestimonial(id: string): Promise<void> {
  setTestimonials(getTestimonials().filter((t) => t.id !== id));
  return cmsDelay(undefined);
}

// ---- CMS: Events ----
export async function getCmsEvents(): Promise<UpcomingEvent[]> {
  return cmsDelay(clone(getUpcomingEvents()));
}
export async function createEvent(data: Omit<UpcomingEvent, "id">): Promise<UpcomingEvent> {
  const item: UpcomingEvent = { ...data, id: genId() };
  setUpcomingEvents([...getUpcomingEvents(), item]);
  return cmsDelay(clone(item));
}
export async function updateEvent(id: string, patch: Partial<UpcomingEvent>): Promise<UpcomingEvent> {
  const list = getUpcomingEvents();
  const updated = list.map((e) => (e.id === id ? { ...e, ...patch } : e));
  setUpcomingEvents(updated);
  return cmsDelay(clone(updated.find((e) => e.id === id)!));
}
export async function deleteEvent(id: string): Promise<void> {
  setUpcomingEvents(getUpcomingEvents().filter((e) => e.id !== id));
  return cmsDelay(undefined);
}

// ---- CMS: Hero Slides ----
export async function getCmsHeroSlides(): Promise<HeroSlide[]> {
  return cmsDelay(clone(getHeroSlides()));
}
export async function updateHeroSlide(id: string, patch: Partial<HeroSlide>): Promise<void> {
  setHeroSlides(getHeroSlides().map((s) => (s.id === id ? { ...s, ...patch } : s)));
  return cmsDelay(undefined);
}
export async function reorderHeroSlides(orderedIds: string[]): Promise<void> {
  const slides = getHeroSlides();
  const reordered = orderedIds.map((id) => slides.find((s) => s.id === id)!).filter(Boolean) as HeroSlide[];
  setHeroSlides(reordered);
  return cmsDelay(undefined);
}

// ---- CMS: Contact Submissions ----
export async function getContactSubmissions(status?: string): Promise<ContactSubmission[]> {
  const list = getRawContactSubmissions();
  return cmsDelay(clone(status && status !== "all" ? list.filter((c) => c.status === status) : list));
}
export async function updateContactStatus(
  id: string,
  status: ContactSubmission["status"],
  replyNote?: string
): Promise<ContactSubmission> {
  const list = getRawContactSubmissions();
  const updated = list.map((c) =>
    c.id === id
      ? {
          ...c,
          status,
          ...(replyNote ? { replyNote } : {}),
          ...(status === "replied" ? { repliedAt: new Date().toISOString() } : {}),
        }
      : c
  );
  setContactSubmissions(updated);
  return cmsDelay(clone(updated.find((c) => c.id === id)!));
}
export async function deleteContactSubmission(id: string): Promise<void> {
  setContactSubmissions(getRawContactSubmissions().filter((c) => c.id !== id));
  return cmsDelay(undefined);
}
export async function submitContactForm(data: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}): Promise<ContactSubmission> {
  const submission: ContactSubmission = {
    ...data,
    id: genId(),
    submittedAt: new Date().toISOString(),
    status: "unread",
  };
  setContactSubmissions([submission, ...getRawContactSubmissions()]);
  return cmsDelay(clone(submission));
}

// ---- CMS: Applications ----
export async function getApplications(status?: string): Promise<ApplicationSubmission[]> {
  const list = getApplicationSubmissions();
  return cmsDelay(clone(status && status !== "all" ? list.filter((a) => a.status === status) : list));
}
export async function updateApplicationStatus(
  id: string,
  status: ApplicationSubmission["status"],
  notes?: string,
  interviewDate?: string
): Promise<ApplicationSubmission> {
  const updated = getApplicationSubmissions().map((a) =>
    a.id === id
      ? {
          ...a,
          status,
          ...(notes ? { notes } : {}),
          ...(interviewDate ? { interviewDate } : {}),
        }
      : a
  );
  setApplicationSubmissions(updated);
  return cmsDelay(clone(updated.find((a) => a.id === id)!));
}
export async function submitApplication(
  data: Omit<ApplicationSubmission, "id" | "applicationRef" | "submittedAt" | "status">
): Promise<ApplicationSubmission> {
  const year = new Date().getFullYear();
  const ref = `APP-${year}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  const submission: ApplicationSubmission = {
    ...data,
    id: genId(),
    applicationRef: ref,
    submittedAt: new Date().toISOString(),
    status: "pending",
  };
  setApplicationSubmissions([submission, ...getApplicationSubmissions()]);
  return cmsDelay(clone(submission));
}

// ---- CMS: School Info ----
export async function getCmsSchoolInfo(): Promise<SchoolInfo> {
  return cmsDelay(clone(getSchoolInfo()));
}
export async function updateSchoolInfo(patch: Partial<SchoolInfo>): Promise<SchoolInfo> {
  setSchoolInfo(patch);
  return cmsDelay(clone(getSchoolInfo()));
}

// ---- CMS: Stats & Features ----
export async function getCmsSchoolStats(): Promise<SchoolStat[]> {
  return cmsDelay(clone(getSchoolStats()));
}
export async function updateSchoolStats(data: SchoolStat[]): Promise<void> {
  setSchoolStats(data);
  return cmsDelay(undefined);
}
export async function getCmsWhyChooseUs(): Promise<WhyChooseUsItem[]> {
  return cmsDelay(clone(getWhyChooseUs()));
}
export async function updateWhyChooseUs(data: WhyChooseUsItem[]): Promise<void> {
  setWhyChooseUs(data);
  return cmsDelay(undefined);
}

// ---- Special Levies ----
export async function getAllLevies(filters?: { classId?: string; status?: string; term?: number }): Promise<SpecialLevy[]> {
  let list = specialLevies;
  if (filters?.classId) list = list.filter(l => l.classId === filters.classId);
  if (filters?.status) list = list.filter(l => l.status === filters.status);
  if (filters?.term) list = list.filter(l => l.term === filters.term);
  return delay(clone(list));
}

export async function getStudentLevies(studentId: string): Promise<StudentLevyStatus[]> {
  const student = students.find(s => s.id === studentId);
  if (!student) return delay([]);

  const applicableLevies = specialLevies.filter(l => {
    if (l.status === "cancelled") return false;
    if (l.scope === "all") return true;
    if (l.scope === "class" && l.classId === student.classId) return true;
    if (l.scope === "grade" && l.gradeLevel === student.gradeLevel) return true;
    if (l.scope === "individual" && l.studentIds?.includes(studentId)) return true;
    return false;
  });

  return delay(applicableLevies.map(levy => {
    const payment = levyPayments.find(p => p.levyId === levy.id && p.studentId === studentId);
    return {
      levy: clone(levy),
      paid: !!payment,
      paidAt: payment?.paidAt,
      amountPaid: payment?.amount,
      receiptNumber: payment?.receiptNumber,
      waived: false,
    };
  }));
}

export async function createLevy(data: Omit<SpecialLevy, 'id' | 'issuedDate'>): Promise<SpecialLevy> {
  const levy: SpecialLevy = {
    ...data,
    id: "lvy-" + Date.now(),
    issuedDate: new Date().toISOString().slice(0, 10),
  };
  specialLevies.push(levy);
  return delay(clone(levy));
}

export async function updateLevy(id: string, patch: Partial<SpecialLevy>): Promise<SpecialLevy> {
  const idx = specialLevies.findIndex(l => l.id === id);
  if (idx === -1) throw new Error("Levy not found");
  specialLevies[idx] = { ...specialLevies[idx], ...patch };
  return delay(clone(specialLevies[idx]));
}

export async function cancelLevy(id: string): Promise<void> {
  const idx = specialLevies.findIndex(l => l.id === id);
  if (idx !== -1) specialLevies[idx].status = "cancelled";
  return delay(undefined);
}

export async function recordLevyPayment(data: Omit<LevyPayment, 'id' | 'receiptNumber'>): Promise<LevyPayment> {
  const pay: LevyPayment = {
    ...data,
    id: "lp-" + Date.now(),
    receiptNumber: `LVR-${String(levyPayments.length + 100).padStart(3, "0")}`,
  };
  levyPayments.push(pay);
  return delay(clone(pay));
}

export async function getLevyCollectionSummary(levyId: string): Promise<{ 
  levy: SpecialLevy; 
  totalStudents: number; 
  paid: number; 
  unpaid: number; 
  totalCollected: number; 
  payments: LevyPayment[] 
}> {
  const levy = specialLevies.find(l => l.id === levyId);
  if (!levy) throw new Error("Levy not found");

  let targetStudents: Student[] = [];
  if (levy.scope === "all") targetStudents = students;
  else if (levy.scope === "class") targetStudents = students.filter(s => s.classId === levy.classId);
  else if (levy.scope === "grade") targetStudents = students.filter(s => s.gradeLevel === levy.gradeLevel);
  else if (levy.scope === "individual") targetStudents = students.filter(s => levy.studentIds?.includes(s.id));

  const relevantPayments = levyPayments.filter(p => p.levyId === levyId);
  const paidCount = relevantPayments.length;
  
  return delay({
    levy: clone(levy),
    totalStudents: targetStudents.length,
    paid: paidCount,
    unpaid: targetStudents.length - paidCount,
    totalCollected: relevantPayments.reduce((sum, p) => sum + p.amount, 0),
    payments: clone(relevantPayments),
  });
}


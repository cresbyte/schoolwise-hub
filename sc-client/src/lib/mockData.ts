/**
 * Realistic mock data for ShuleSmart (Primrose Private Academy, Nairobi).
 * Data is generated deterministically at module load.
 * @module mockData
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  AttendanceRecord,
  AuditLog,
  ClassRoom,
  ClassSubject,
  Exam,
  ExamMark,
  FeePayment,
  FeeStructure,
  GradeLevel,
  LeaveRequest,
  AppNotification,
  PayrollRecord,
  School,
  Staff,
  Student,
  Subject,
  TimetableSlot,
  User,
  Curriculum,
  SchoolMessage,
  ParentReply,
  SpecialLevy,
  LevyPayment,
  TermEvent,
} from "./types";
import { computePayroll, getCBCRating, getGrade, staffAvatarUrl, studentAvatarUrl } from "./utils";
import { DAYS_OF_WEEK } from "./constants";

/** Tiny deterministic PRNG so data stays stable between renders. */
let seed = 20260611;
function rand(): number {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}
function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}
function phone(): string {
  const prefix = pick(["07", "01"]);
  let n = "";
  for (let i = 0; i < 8; i++) n += randInt(0, 9);
  return prefix + n;
}

export const school: School = {
  id: "sch-1",
  name: "Primrose Private Academy",
  motto: "Knowledge · Integrity · Excellence",
  registrationNumber: "P/REG/NAK/2456",
  knecCode: "30412104",
  nemisCode: "NAK-30412104",
  postalAddress: "P.O. Box 1245-20100, Nairobi",
  physicalAddress: "Milimani Road, Nairobi Town",
  county: "Nairobi",
  subCounty: "Nairobi East",
  phone: "0712345678",
  email: "info@primroseacademy.ac.ke",
  website: "www.primroseacademy.ac.ke",
  principalName: "Mr. Daniel Kamau",
  curriculum: ["CBC", "844"],
  mpesaPaybill: "522533",
  mpesaTill: "5045120",
  smsSenderId: "GREENFIELD",
  currentTerm: 2,
  currentYear: 2026,
  termStartDate: "2026-05-06",
  termEndDate: "2026-08-09",
};

export const classes: ClassRoom[] = [
  { id: "cls-1", name: "PP1 A", gradeLevel: "PP1", stream: "A", curriculum: "CBC", classTeacherId: "stf-2", classTeacherName: "Ms. Grace Wanjiku Mwangi", capacity: 30, studentCount: 28, room: "B1", academicYear: 2026 },
  { id: "cls-2", name: "PP2 A", gradeLevel: "PP2", stream: "A", curriculum: "CBC", classTeacherId: "stf-10", classTeacherName: "Ms. Hannah Cherop Bett", capacity: 32, studentCount: 30, room: "B2", academicYear: 2026 },
  { id: "cls-3", name: "Grade 4 A", gradeLevel: "Grade 4", stream: "A", curriculum: "CBC", classTeacherId: "stf-7", classTeacherName: "Mr. Peter Maina Gichuru", capacity: 40, studentCount: 35, room: "C1", academicYear: 2026 },
  { id: "cls-4", name: "Grade 6 A", gradeLevel: "Grade 6", stream: "A", curriculum: "CBC", classTeacherId: "stf-7", classTeacherName: "Mr. Peter Maina Gichuru", capacity: 38, studentCount: 32, room: "C2", academicYear: 2026 },
  { id: "cls-5", name: "Grade 8 A", gradeLevel: "Grade 8", stream: "A", curriculum: "CBC", classTeacherId: "stf-8", classTeacherName: "Ms. Rose Akinyi Owino", capacity: 35, studentCount: 29, room: "C3", academicYear: 2026 },
  { id: "cls-6", name: "Form 1 A", gradeLevel: "Form 1", stream: "A", curriculum: "844", classTeacherId: "stf-3", classTeacherName: "Mr. John Mutua Kivuva", capacity: 45, studentCount: 40, room: "D1", academicYear: 2026 },
  { id: "cls-7", name: "Form 2 A", gradeLevel: "Form 2", stream: "A", curriculum: "844", classTeacherId: "stf-4", classTeacherName: "Ms. Faith Chemutai Kosgei", capacity: 45, studentCount: 38, room: "D2", academicYear: 2026 },
  { id: "cls-8", name: "Form 4 A", gradeLevel: "Form 4", stream: "A", curriculum: "844", classTeacherId: "stf-5", classTeacherName: "Mr. Samuel Omondi Otieno", capacity: 40, studentCount: 36, room: "D4", academicYear: 2026 },
];

export const staff: Staff[] = [
  mkStaff("stf-1", "STF-0001", "Daniel", "Njoroge", "Male", "Principal", 85000, 25000, 15000, "stf-1"),
  mkStaff("stf-2", "STF-0002", "Grace", "Mwangi", "Female", "PP1 Class Teacher", 35000, 10000, 6000, "cls-1"),
  mkStaff("stf-3", "STF-0003", "John", "Kivuva", "Male", "Mathematics Teacher", 42000, 12000, 7000, "cls-6"),
  mkStaff("stf-4", "STF-0004", "Faith", "Kosgei", "Female", "English Teacher", 40000, 11000, 7000, "cls-7"),
  mkStaff("stf-5", "STF-0005", "Samuel", "Otieno", "Male", "Physics Teacher", 45000, 12000, 8000, "cls-8"),
  mkStaff("stf-6", "STF-0006", "Agnes", "Kariuki", "Female", "Accountant", 38000, 10000, 6000),
  mkStaff("stf-7", "STF-0007", "Peter", "Gichuru", "Male", "Grade 6 Class Teacher", 36000, 10000, 6000, "cls-4"),
  mkStaff("stf-8", "STF-0008", "Rose", "Owino", "Female", "Grade 8 Class Teacher", 38000, 10000, 6000, "cls-5"),
  mkStaff("stf-9", "STF-0009", "Charles", "Githinji", "Male", "Biology Teacher", 41000, 11000, 7000),
  mkStaff("stf-10", "STF-0010", "Hannah", "Bett", "Female", "PP2 Class Teacher", 33000, 9000, 5000, "cls-2"),
  mkStaff("stf-11", "STF-0011", "Joseph", "Mutua", "Male", "Deputy Principal", 65000, 20000, 12000),
  mkStaff("stf-12", "STF-0012", "Beatrice", "Ouma", "Female", "CRE Teacher", 39000, 11000, 7000),
];

function mkStaff(
  id: string,
  staffNumber: string,
  firstName: string,
  lastName: string,
  gender: "Male" | "Female",
  designation: string,
  basicSalary: number,
  houseAllowance: number,
  transportAllowance: number,
  classAssigned?: string,
): Staff {
  return {
    id,
    staffNumber,
    firstName,
    lastName,
    gender,
    dateOfBirth: `19${randInt(75, 95)}-0${randInt(1, 9)}-1${randInt(0, 9)}`,
    phone: phone(),
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@primroseacademy.ac.ke`,
    idNumber: String(randInt(20000000, 39999999)),
    kraPin: `A0${randInt(10000000, 99999999)}X`,
    nssfNumber: String(randInt(1000000, 9999999)),
    shifNumber: String(randInt(1000000, 9999999)),
    contractType: pick(["permanent", "tsc", "bom", "contract"]),
    designation,
    department: designation.includes("Teacher") ? "Academics" : "Administration",
    classAssigned,
    dateJoined: `20${randInt(15, 22)}-0${randInt(1, 9)}-1${randInt(0, 5)}`,
    status: "active",
    basicSalary,
    houseAllowance,
    transportAllowance,
    otherAllowances: 0,
    bankName: pick(["KCB", "Equity Bank", "Co-operative Bank", "Absa"]),
    bankAccount: String(randInt(1000000000, 9999999999)),
    bankBranch: "Nairobi",
    nextOfKin: { name: "Mary " + lastName, relationship: "Spouse", phone: phone() },
    avatarUrl: staffAvatarUrl(`${firstName} ${lastName}`, id),
  };
}

export const users: User[] = [
  {
    id: "usr-1",
    name: "Mr. Daniel Kamau",
    firstName: "Daniel",
    lastName: "Kamau",
    email: "principal@primroseacademy.ac.ke",
    phone: "0712345678",
    role: "admin",
    staffId: "stf-1",
    isActive: true,
    lastLogin: "2026-06-10T08:12:00Z",
    createdAt: "2023-01-10T00:00:00Z",
    gender: "Male",
    birthDate: "1975-03-15"
  },
  {
    id: "usr-2",
    name: "Mr. Joseph Mwangangi Mutua",
    firstName: "Joseph",
    lastName: "Mwangangi",
    email: "deputy@primroseacademy.ac.ke",
    phone: "0711234567",
    role: "headteacher",
    staffId: "stf-11",
    isActive: true,
    lastLogin: "2026-06-10T07:50:00Z",
    createdAt: "2023-01-10T00:00:00Z",
    gender: "Male",
    birthDate: "1978-07-20"
  },
  // Add similar fields for all other users...
];

/** Login credentials used on the login page helper. */
export const credentials: Record<string, { password: string; userId: string }> = {
  "0712345678": { password: "admin123", userId: "usr-1" },
  "0711234567": { password: "head123", userId: "usr-2" },
  "0722345678": { password: "teacher123", userId: "usr-3" },
  "0733456789": { password: "accounts123", userId: "usr-4" },
  "0744567890": { password: "parent123", userId: "usr-5" },
  "0755123456": { password: "parent456", userId: "usr-6" },
};

const FIRST_NAMES_M = ["Brian", "Dennis", "Francis", "Hassan", "James", "Kelvin", "Martin", "Oliver", "Peter", "Samuel", "Victor", "Daniel", "Eric", "George", "Isaac", "Kevin", "Mark", "Noah", "Allan", "Collins"];
const FIRST_NAMES_F = ["Amina", "Christine", "Esther", "Grace", "Irene", "Lydia", "Nancy", "Purity", "Rose", "Sharon", "Wendy", "Faith", "Joy", "Mercy", "Naomi", "Pauline", "Stella", "Tabitha", "Vivian", "Winnie"];
const MIDDLE_NAMES = ["Wanjiru", "Otieno", "Njeri", "Kipchoge", "Adhiambo", "Muthomi", "Wambui", "Musa", "Chebet", "Njoroge", "Waweru", "Muthoni", "Ochieng", "Wairimu", "Kimani", "Akinyi", "Cherono", "Mwende", "Kiprop", "Nyambura"];
const LAST_NAMES = ["Kamau", "Odhiambo", "Mwangi", "Rotich", "Were", "Njogu", "Ndungu", "Abdi", "Kiptoo", "Muigai", "Thuo", "Kinyua", "Otieno", "Njuguna", "Maina", "Owino", "Korir", "Mutiso", "Wafula", "Cheruiyot"];
const LOCATIONS = ["Milimani", "Section 58", "Kiamunyi", "London", "Free Area", "Bahati", "Lanet", "Pipeline", "Naka", "Shabab"];

/** Named seed students from the brief, then generated to reach 40. */
const namedStudents: Array<[string, string, string, string, "Male" | "Female", string]> = [
  ["std-1", "ADM-2026-0001", "Amina", "Kamau", "Female", "cls-3"],
  ["std-2", "ADM-2026-0002", "Brian", "Odhiambo", "Male", "cls-7"],
  ["std-3", "ADM-2026-0003", "Christine", "Mwangi", "Female", "cls-8"],
  ["std-4", "ADM-2026-0004", "Dennis", "Rotich", "Male", "cls-4"],
  ["std-5", "ADM-2026-0005", "Esther", "Were", "Female", "cls-1"],
  ["std-6", "ADM-2023-0018", "Francis", "Njogu", "Male", "cls-6"],
  ["std-7", "ADM-2026-0007", "Grace", "Ndungu", "Female", "cls-5"],
  ["std-8", "ADM-2022-0031", "Hassan", "Abdi", "Male", "cls-8"],
  ["std-9", "ADM-2026-0009", "Irene", "Kiptoo", "Female", "cls-3"],
  ["std-10", "ADM-2023-0022", "James", "Muigai", "Male", "cls-7"],
  ["std-11", "ADM-2026-0011", "Kelvin", "Thuo", "Male", "cls-4"],
  ["std-12", "ADM-2021-0045", "Lydia", "Kinyua", "Female", "cls-8"],
  ["std-13", "ADM-2026-0013", "Martin", "Otieno", "Male", "cls-2"],
  ["std-14", "ADM-2023-0028", "Nancy", "Mwangi", "Female", "cls-6"],
  ["std-15", "ADM-2026-0015", "Oliver", "Njuguna", "Male", "cls-3"],
];

function classOf(classId: string): ClassRoom {
  return classes.find((c) => c.id === classId)!;
}

function buildStudents(): Student[] {
  const list: Student[] = [];
  for (const [id, adm, first, last, gender, classId] of namedStudents) {
    list.push(mkStudent(id, adm, first, pick(MIDDLE_NAMES), last, gender, classId));
  }
  for (let i = 16; i <= 40; i++) {
    const gender = rand() > 0.5 ? "Male" : "Female";
    const first = gender === "Male" ? pick(FIRST_NAMES_M) : pick(FIRST_NAMES_F);
    const classId = classes[randInt(0, classes.length - 1)].id;
    const adm = `ADM-2026-${String(i).padStart(4, "0")}`;
    list.push(mkStudent(`std-${i}`, adm, first, pick(MIDDLE_NAMES), pick(LAST_NAMES), gender, classId));
  }
  return list;
}

function mkStudent(
  id: string,
  admissionNumber: string,
  firstName: string,
  otherName: string,
  lastName: string,
  gender: "Male" | "Female",
  classId: string,
): Student {
  const cls = classOf(classId);
  const boarding = rand() > 0.7 ? "boarding" : "day";
  const feeBalance = pick([-2000, 0, 0, 3500, 8000, 12500, 18000, 27000, 45000, 5500]);
  const fatherName = `Mr. ${pick(["Stephen", "Joseph", "Patrick", "Anthony", "David"])} ${lastName}`;
  const motherName = `Mrs. ${pick(["Jane", "Lucy", "Catherine", "Susan", "Margaret"])} ${lastName}`;
  const primaryName = rand() > 0.5 ? fatherName : motherName;
  const primaryPhone = phone();
  return {
    id,
    admissionNumber,
    firstName,
    lastName,
    otherName,
    gender,
    dateOfBirth: birthDateForGrade(cls.gradeLevel),
    classId,
    className: cls.name,
    gradeLevel: cls.gradeLevel,
    curriculum: cls.curriculum,
    admissionDate: `20${randInt(21, 24)}-0${randInt(1, 9)}-1${randInt(0, 5)}`,
    status: "active",
    nemisNumber: String(randInt(100000000, 999999999)),
    birthCertNumber: String(randInt(1000000, 9999999)),
    parent: {
      fatherName,
      fatherPhone: phone(),
      fatherEmail: `${firstName.toLowerCase()}.dad@gmail.com`,
      fatherIdNumber: String(randInt(10000000, 39999999)),
      fatherOccupation: pick(["Farmer", "Teacher", "Businessman", "Engineer", "Driver"]),
      motherName,
      motherPhone: phone(),
      motherOccupation: pick(["Nurse", "Teacher", "Trader", "Tailor", "Civil Servant"]),
      primaryContactName: primaryName,
      primaryContactPhone: primaryPhone,
    },
    homeLocation: pick(LOCATIONS),
    boardingStatus: boarding,
    feeBalance,
    avatarUrl: studentAvatarUrl(firstName, lastName, id),
  };
}

function birthDateForGrade(grade: GradeLevel): string {
  const ageMap: Record<string, number> = {
    PP1: 5, PP2: 6, "Grade 1": 7, "Grade 2": 8, "Grade 3": 9, "Grade 4": 10,
    "Grade 5": 11, "Grade 6": 12, "Grade 7": 13, "Grade 8": 14, "Grade 9": 15,
    "Form 1": 14, "Form 2": 15, "Form 3": 16, "Form 4": 17,
  };
  const age = ageMap[grade] ?? 12;
  const year = 2026 - age;
  return `${year}-0${randInt(1, 9)}-1${randInt(0, 8)}`;
}

export const students: Student[] = buildStudents();

const CBC_SUBJECTS: Array<[string, string, string]> = [
  ["English", "ENG", "Languages"],
  ["Kiswahili", "KIS", "Languages"],
  ["Mathematics", "MAT", "Mathematics"],
  ["Science & Technology", "SCI", "Science"],
  ["Social Studies", "SST", "Humanities"],
  ["Creative Arts", "CRA", "Creative Arts"],
  ["Religious Education", "CRE", "Humanities"],
  ["Agriculture", "AGR", "Applied Science"],
];
const EIGHT_SUBJECTS: Array<[string, string, string]> = [
  ["English", "101", "Languages"],
  ["Kiswahili", "102", "Languages"],
  ["Mathematics", "121", "Sciences"],
  ["Biology", "231", "Sciences"],
  ["Physics", "232", "Sciences"],
  ["Chemistry", "233", "Sciences"],
  ["History & Government", "311", "Humanities"],
  ["Geography", "312", "Humanities"],
  ["C.R.E", "313", "Humanities"],
  ["Business Studies", "565", "Technicals"],
];

export const subjects: Subject[] = [
  ...CBC_SUBJECTS.map(([name, code, area], i) => ({
    id: `sub-cbc-${i}`,
    name,
    code,
    curriculum: "CBC" as Curriculum,
    gradeLevel: ["Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"] as GradeLevel[],
    isCore: i < 5,
    learningArea: area,
  })),
  ...EIGHT_SUBJECTS.map(([name, code, area], i) => ({
    id: `sub-844-${i}`,
    name,
    code,
    curriculum: "844" as Curriculum,
    gradeLevel: ["Form 1", "Form 2", "Form 3", "Form 4"] as GradeLevel[],
    isCore: i < 3,
    learningArea: area,
  })),
];

export const classSubjects: ClassSubject[] = (() => {
  const list: ClassSubject[] = [];
  const teacherFor = (clsId: string, subName: string): Staff => {
    // Feature 4A: Deterministic assignments
    if (subName === "Mathematics") return staff.find((s) => s.id === "stf-3")!;
    if (subName === "English") return staff.find((s) => s.id === "stf-4")!;
    if (subName === "Physics" || subName === "Chemistry") return staff.find((s) => s.id === "stf-5")!;
    if (subName === "Biology") return staff.find((s) => s.id === "stf-9")!;
    if (subName.includes("C.R.E") || subName.includes("Religious Education")) return staff.find((s) => s.id === "stf-12")!;

    // CBC Class teacher assignments
    const cls = classes.find((c) => c.id === clsId)!;
    if (cls.curriculum === "CBC" && cls.classTeacherId) {
      return staff.find((s) => s.id === cls.classTeacherId)!;
    }

    return pick(staff);
  };

  for (const cls of classes) {
    const subs = subjects.filter((s) => s.curriculum === cls.curriculum);
    for (const s of subs) {
      const teacher = teacherFor(cls.id, s.name);
      list.push({
        id: `cs-${cls.id}-${s.id}`,
        classId: cls.id,
        subjectId: s.id,
        subjectName: s.name,
        teacherId: teacher.id,
        teacherName: `${teacher.firstName} ${teacher.lastName}`,
        periodsPerWeek: s.name === "Mathematics" || s.name === "English" ? 6 : randInt(3, 5),
      });
    }
  }
  return list;
})();

export const exams: Exam[] = [
  { id: "exm-1", name: "Term 2 Opener 2026", type: "opener", term: 2, year: 2026, startDate: "2026-05-13", endDate: "2026-05-17", gradeLevel: classes.map((c) => c.gradeLevel), outOf: 100, status: "published", createdBy: "usr-1" },
  { id: "exm-2", name: "Term 2 Mid-Term 2026", type: "midterm", term: 2, year: 2026, startDate: "2026-06-17", endDate: "2026-06-21", gradeLevel: classes.map((c) => c.gradeLevel), outOf: 100, status: "completed", createdBy: "usr-1" },
  { id: "exm-3", name: "Term 2 End-Term 2026", type: "endterm", term: 2, year: 2026, startDate: "2026-08-05", endDate: "2026-08-09", gradeLevel: classes.map((c) => c.gradeLevel), outOf: 100, status: "upcoming", createdBy: "usr-1" },
];

export const examMarks: ExamMark[] = (() => {
  const list: ExamMark[] = [];
  for (const exam of exams.filter((e) => e.status !== "upcoming")) {
    for (const student of students) {
      const subs = subjects.filter((s) => s.curriculum === student.curriculum);
      for (const sub of subs) {
        const marks = randInt(30, 95);
        const comments = [
          "Shows great understanding of the topic.",
          "Needs more practice on calculations.",
          "Excellent grasp of concepts.",
          "Improvement noted this term.",
          "Should participate more in class.",
        ];
        list.push({
          id: `mk-${exam.id}-${student.id}-${sub.id}`,
          examId: exam.id,
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          admissionNumber: student.admissionNumber,
          subjectId: sub.id,
          subjectName: sub.name,
          classId: student.classId,
          marks,
          cbcRating: student.curriculum === "CBC" ? getCBCRating(marks) : undefined,
          grade: getGrade(marks),
          teacherComment: rand() > 0.4 ? pick(comments) : undefined,
          enteredBy: "Mr. John Mutua Kivuva",
          enteredAt: exam.endDate + "T16:00:00Z",
        });
      }
    }
  }
  return list;
})();

export const feeStructures: FeeStructure[] = [
  mkFee("fs-1", "Day Student (Grade 1-6)", "Grade 4", "day", [["Tuition", 9500], ["Activity Fee", 1500], ["Exam Fee", 1500]]),
  mkFee("fs-2", "Day Student (Grade 7-9)", "Grade 8", "day", [["Tuition", 12000], ["Activity Fee", 1500], ["Exam Fee", 1500]]),
  mkFee("fs-3", "Day Student (Form 1-4)", "Form 2", "day", [["Tuition", 15000], ["Activity Fee", 1500], ["Exam Fee", 1500]]),
  mkFee("fs-4", "Boarding Top-up (All)", "Form 1", "boarding", [["Boarding", 14000], ["Meals", 8000]]),
];

function mkFee(id: string, name: string, gradeLevel: GradeLevel, boarding: any, items: [string, number][]): FeeStructure {
  const feeItems = items.map(([n, a], i) => ({ id: `${id}-i${i}`, name: n, amount: a, isOptional: false }));
  return {
    id,
    name,
    academicYear: 2026,
    term: 2,
    gradeLevel,
    boardingStatus: boarding,
    items: feeItems,
    totalAmount: feeItems.reduce((s, i) => s + i.amount, 0),
    dueDate: "2026-05-31",
    status: "active",
  };
}

function mpesaCode(): string {
  const chars = "ABCDEFGHIJKLMNPQRSTUVWXYZ";
  let s = "";
  for (let i = 0; i < 3; i++) s += chars[randInt(0, chars.length - 1)];
  for (let i = 0; i < 7; i++) s += randInt(0, 9);
  return s;
}

export const payments: FeePayment[] = (() => {
  const list: FeePayment[] = [];
  // Current term payments (Term 2 2026)
  for (let i = 0; i < 60; i++) {
    const student = pick(students);
    const method = pick(["mpesa", "cash", "bank_transfer"] as const);
    const amount = pick([5000, 10000, 15000, 25000, 4500, 3000]);
    const month = randInt(5, 6);
    const day = randInt(1, 28);
    list.push({
      id: `pay-2026-${i}`,
      receiptNumber: `RCP-2026-${String(1000 + i).padStart(5, "0")}`,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      admissionNumber: student.admissionNumber,
      className: student.className,
      term: 2,
      year: 2026,
      amount,
      paymentMethod: method,
      mpesaCode: method === "mpesa" ? mpesaCode() : undefined,
      bankReference: method === "bank_transfer" ? "REF" + randInt(100000, 999999) : undefined,
      paymentDate: `2026-0${month}-${String(day).padStart(2, "0")}`,
      receivedBy: "Ms. Agnes Njoki Kariuki",
    });
  }
  // Historical payments (Term 1 2026 and 2025)
  for (let i = 0; i < 40; i++) {
    const student = pick(students);
    const method = pick(["bank_transfer", "mpesa"] as const);
    const amount = pick([15000, 20000, 30000]);
    const term = pick([1, 3] as const);
    const year = term === 1 ? 2026 : 2025;
    const month = term === 1 ? randInt(1, 3) : randInt(9, 11);
    list.push({
      id: `pay-hist-${i}`,
      receiptNumber: `RCP-${year}-${String(500 + i).padStart(5, "0")}`,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      admissionNumber: student.admissionNumber,
      className: student.className,
      term: term as any,
      year,
      amount,
      paymentMethod: method,
      paymentDate: `${year}-${String(month).padStart(2, "0")}-${randInt(10, 25)}`,
      receivedBy: "Ms. Agnes Njoki Kariuki",
    });
  }
  return list.sort((a, b) => (a.paymentDate < b.paymentDate ? 1 : -1));
})();

function buildPayroll(month: number, status: "paid" | "draft"): PayrollRecord[] {
  return staff.map((s, i) => {
    const c = computePayroll(s.basicSalary, s.houseAllowance, s.transportAllowance, s.otherAllowances);
    return {
      id: `pr-${month}-${s.id}`,
      staffId: s.id,
      staffName: `${s.firstName} ${s.lastName}`,
      staffNumber: s.staffNumber,
      month,
      year: 2026,
      basicSalary: s.basicSalary,
      houseAllowance: s.houseAllowance,
      transportAllowance: s.transportAllowance,
      otherAllowances: s.otherAllowances,
      grossPay: c.grossPay,
      paye: c.paye,
      nssf: c.nssf,
      shif: c.shif,
      housingLevy: c.housingLevy,
      loanDeduction: 0,
      otherDeductions: 0,
      totalDeductions: c.totalDeductions,
      netPay: c.netPay,
      paymentStatus: status,
      paymentDate: status === "paid" ? `2026-0${month}-28` : undefined,
      paymentMethod: status === "paid" ? "bank_transfer" : undefined,
      processedBy: "Ms. Agnes Njoki Kariuki",
      approvedBy: status === "paid" ? "Mr. Daniel Kamau" : undefined,
    };
  });
}

export const payroll: PayrollRecord[] = [...buildPayroll(5, "paid"), ...buildPayroll(6, "draft")];

const PERIOD_TIMES = [
  ["08:00", "08:40"], ["08:40", "09:20"], ["09:20", "10:00"], ["10:20", "11:00"],
  ["11:00", "11:40"], ["11:40", "12:20"], ["14:00", "14:40"], ["14:40", "15:20"],
];

function buildTimetable(classId: string): TimetableSlot[] {
  const cls = classOf(classId);
  const subs = subjects.filter((s) => s.curriculum === cls.curriculum);
  const slots: TimetableSlot[] = [];
  for (const day of DAYS_OF_WEEK) {
    let period = 0;
    PERIOD_TIMES.forEach(([start, end], idx) => {
      period++;
      if (idx === 3) {
        slots.push({ id: `tt-${classId}-${day}-break`, classId, day, periodNumber: period, startTime: "10:00", endTime: "10:20", isBreak: true, breakName: "Morning Break" });
      }
      const sub = subs[(idx + DAYS_OF_WEEK.indexOf(day)) % subs.length];
      slots.push({
        id: `tt-${classId}-${day}-${idx}`,
        classId,
        day,
        periodNumber: period,
        startTime: start,
        endTime: end,
        subjectId: sub.id,
        subjectName: sub.name,
        teacherId: pick(staff).id,
        teacherName: pick(staff).firstName + " " + pick(staff).lastName,
        isBreak: false,
      });
      if (idx === 5) {
        slots.push({ id: `tt-${classId}-${day}-lunch`, classId, day, periodNumber: ++period, startTime: "13:00", endTime: "14:00", isBreak: true, breakName: "Lunch Break" });
      }
    });
  }
  return slots;
}

export const timetables: Record<string, TimetableSlot[]> = {
  "cls-7": buildTimetable("cls-7"),
  "cls-4": buildTimetable("cls-4"),
};

export const attendance: AttendanceRecord[] = (() => {
  const list: AttendanceRecord[] = [];
  const allStudents = students;
  // Last 20 school days
  for (let d = 0; d < 20; d++) {
    const date = new Date("2026-05-15");
    date.setDate(date.getDate() + d);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    const iso = date.toISOString().slice(0, 10);
    for (const st of allStudents) {
      const r = rand();
      const status = r > 0.95 ? "absent" : r > 0.90 ? "late" : r > 0.88 ? "excused" : "present";
      list.push({
        id: `att-${st.id}-${iso}`,
        studentId: st.id,
        studentName: `${st.firstName} ${st.lastName}`,
        classId: st.classId,
        date: iso,
        status,
        reason: status === "absent" ? pick(["Sick", "Family emergency", "Travel"]) : status === "excused" ? "School activity" : undefined,
        recordedBy: pick(staff).firstName + " " + pick(staff).lastName,
        recordedAt: iso + "T08:15:00Z",
        parentNotified: status === "absent",
      });
    }
  }
  return list;
})();

export const leaveRequests: LeaveRequest[] = [
  { id: "lv-1", staffId: "stf-4", staffName: "Faith Kosgei", leaveType: "annual", startDate: "2026-06-20", endDate: "2026-06-25", days: 5, reason: "Family function upcountry", status: "approved", appliedOn: "2026-06-01", reviewedBy: "Mr. Daniel Kamau", reviewedOn: "2026-06-03" },
  { id: "lv-2", staffId: "stf-9", staffName: "Charles Githinji", leaveType: "sick", startDate: "2026-06-12", endDate: "2026-06-14", days: 3, reason: "Medical treatment", status: "pending", appliedOn: "2026-06-10" },
  { id: "lv-3", staffId: "stf-10", staffName: "Hannah Bett", leaveType: "maternity", startDate: "2026-07-01", endDate: "2026-09-30", days: 90, reason: "Maternity leave", status: "approved", appliedOn: "2026-05-20", reviewedBy: "Mr. Daniel Kamau", reviewedOn: "2026-05-22" },
];

export const notifications: AppNotification[] = [
  { id: "ntf-1", title: "Fee Payment Received", message: "KES 12,500.00 received from Amina Kamau (M-Pesa).", type: "success", read: false, createdAt: "2026-06-10T09:15:00Z" },
  { id: "ntf-2", title: "Mid-Term Exam", message: "Term 2 Mid-Term exam marking is in progress.", type: "info", read: false, createdAt: "2026-06-09T11:00:00Z" },
  { id: "ntf-3", title: "Student Absent", message: "Brian Odhiambo (Form 2 A) was marked absent today.", type: "warning", read: false, createdAt: "2026-06-10T08:35:00Z" },
  { id: "ntf-4", title: "Low Fee Balance Alert", message: "8 students have a fee balance above KES 10,000.", type: "error", read: true, createdAt: "2026-06-08T07:00:00Z" },
  { id: "ntf-5", title: "Payroll Ready", message: "June 2026 payroll draft is ready for review.", type: "info", read: true, createdAt: "2026-06-07T10:00:00Z" },
  { id: "ntf-6", title: "Parent Replies", message: "2 parent replies awaiting review.", type: "info", read: false, createdAt: "2026-06-12T08:00:00Z" },
  { id: "ntf-7", title: "Urgent Message", message: "Urgent message sent to all parents regarding school closure.", type: "success", read: false, createdAt: "2026-06-12T09:00:00Z" },
];

export const schoolMessages: SchoolMessage[] = [
  {
    id: "msg-1",
    subject: "Term 2 Closing Date",
    body: "Dear parents, please note that the school will close for Term 2 on August 9th, 2026.",
    channel: "announcement",
    recipientType: "all_parents",
    sentBy: "Daniel Njoroge",
    sentById: "stf-1",
    sentAt: "2026-06-10T10:00:00Z",
    status: "sent",
    priority: "normal",
  },
  {
    id: "msg-2",
    subject: "Sports Day Notice",
    body: "All students are required to have their sports gear ready for the upcoming Sports Day on June 25th.",
    channel: "announcement",
    recipientType: "all_parents",
    sentBy: "Daniel Njoroge",
    sentById: "stf-1",
    sentAt: "2026-06-11T09:00:00Z",
    status: "sent",
    priority: "normal",
    attachmentLabel: "Sports_Day_Schedule.pdf",
  },
  {
    id: "msg-3",
    subject: "Form 2A: Mathematics Exam rescheduled",
    body: "The Mathematics mid-term for Form 2A has been moved to Thursday morning.",
    channel: "circular",
    recipientType: "class_parents",
    classId: "cls-7",
    className: "Form 2 A",
    sentBy: "John Kivuva",
    sentById: "stf-3",
    sentAt: "2026-06-12T08:30:00Z",
    status: "sent",
    priority: "normal",
  },
  {
    id: "msg-4",
    subject: "Fee Reminder - Brian Odhiambo",
    body: "Dear parent, this is a friendly reminder to clear the outstanding fee balance of KES 12,500 for Brian.",
    channel: "direct",
    recipientType: "individual_parent",
    studentId: "std-2",
    studentName: "Brian Odhiambo",
    parentName: "Mr. Stephen Kamau",
    sentBy: "Agnes Kariuki",
    sentById: "stf-6",
    sentAt: "2026-06-12T10:00:00Z",
    status: "sent",
    priority: "normal",
  },
  {
    id: "msg-5",
    subject: "Absence Follow-up - Amina Kamau",
    body: "Amina was not in school today. Please let us know if everything is okay.",
    channel: "direct",
    recipientType: "individual_parent",
    studentId: "std-1",
    studentName: "Amina Kamau",
    parentName: "Mr. Stephen Kamau",
    sentBy: "Rose Owino",
    sentById: "stf-8",
    sentAt: "2026-06-12T11:00:00Z",
    status: "sent",
    priority: "normal",
  },
  {
    id: "msg-6",
    subject: "Early Closure Tomorrow",
    body: "Please note that the school will close at 12:30 PM tomorrow due to a scheduled staff meeting.",
    channel: "sms_alert",
    recipientType: "all_parents",
    sentBy: "Daniel Njoroge",
    sentById: "stf-1",
    sentAt: "2026-06-12T14:00:00Z",
    status: "sent",
    priority: "urgent",
  },
  {
    id: "msg-7",
    subject: "Academic Performance Discussion",
    body: "I would like to discuss Christine's progress in Physics. Please book a time to see me.",
    channel: "direct",
    recipientType: "individual_parent",
    studentId: "std-3",
    studentName: "Christine Mwangi",
    sentBy: "Samuel Otieno",
    sentById: "stf-5",
    sentAt: "2026-06-12T15:00:00Z",
    status: "sent",
    priority: "normal",
  },
  {
    id: "msg-8",
    subject: "Holiday Assignment",
    body: "English holiday assignment for Grade 6 has been posted on the portal.",
    channel: "circular",
    recipientType: "class_parents",
    classId: "cls-4",
    className: "Grade 6 A",
    sentBy: "Faith Kosgei",
    sentById: "stf-4",
    sentAt: "2026-06-12T16:00:00Z",
    status: "sent",
    priority: "normal",
  },
];

export const parentReplies: ParentReply[] = [
  {
    id: "rep-1",
    messageId: "msg-4",
    parentName: "Mr. Stephen Kamau",
    studentName: "Brian Odhiambo",
    body: "Thank you for the reminder. I will clear the balance by Friday.",
    sentAt: "2026-06-12T12:00:00Z",
    readByStaff: false,
  },
  {
    id: "rep-2",
    messageId: "msg-5",
    parentName: "Mr. Stephen Kamau",
    studentName: "Amina Kamau",
    body: "Amina had a slight fever this morning. She should be back tomorrow.",
    sentAt: "2026-06-12T13:00:00Z",
    readByStaff: false,
  },
  {
    id: "rep-3",
    messageId: "msg-7",
    parentName: "Mrs. Lucy Mwangi",
    studentName: "Christine Mwangi",
    body: "I will be available on Monday at 4:00 PM. Does that work for you?",
    sentAt: "2026-06-12T17:00:00Z",
    readByStaff: true,
  },
];

export const specialLevies: SpecialLevy[] = [
  {
    id: "lvy-1",
    title: "Form 2A Naivasha Educational Trip",
    description: "Educational visit to Lake Naivasha and Hell's Gate for geography studies.",
    amount: 3500,
    scope: "class",
    classId: "cls-7",
    className: "Form 2 A",
    category: "trip",
    academicYear: 2026,
    term: 2,
    dueDate: "2026-07-15",
    issuedDate: "2026-06-01",
    issuedBy: "Faith Kosgei",
    status: "active",
  },
  {
    id: "lvy-2",
    title: "Grade 7 CBC Science Kit",
    description: "Basic science experiment kit required for home assignments.",
    amount: 1200,
    scope: "grade",
    gradeLevel: "Grade 7",
    category: "kit",
    academicYear: 2026,
    term: 2,
    dueDate: "2026-07-01",
    issuedDate: "2026-06-05",
    issuedBy: "Agnes Kariuki",
    status: "active",
  },
  {
    id: "lvy-3",
    title: "Term 2 School Magazine",
    description: "Annual school magazine featuring highlights of the year.",
    amount: 350,
    scope: "all",
    category: "stationery",
    academicYear: 2026,
    term: 2,
    dueDate: "2026-07-30",
    issuedDate: "2026-06-10",
    issuedBy: "Daniel Njoroge",
    status: "active",
  },
  {
    id: "lvy-4",
    title: "Inter-Schools Athletics Tournament",
    description: "Transportation and snacks for students participating in the tournament.",
    amount: 500,
    scope: "class",
    classId: "cls-8",
    className: "Form 4 A",
    category: "activity",
    academicYear: 2026,
    term: 2,
    dueDate: "2026-06-28",
    issuedDate: "2026-06-10",
    issuedBy: "Samuel Otieno",
    status: "closed",
  },
  {
    id: "lvy-5",
    title: "Replacement School Diary",
    description: "Replacement fee for lost or damaged school diary.",
    amount: 200,
    scope: "individual",
    studentIds: ["std-1"],
    category: "stationery",
    academicYear: 2026,
    term: 2,
    dueDate: "2026-06-20",
    issuedDate: "2026-06-10",
    issuedBy: "Rose Owino",
    status: "active",
  },
  {
    id: "lvy-6",
    title: "Form 4 Graduation Ceremony",
    description: "Contribution towards the Form 4 graduation gown and dinner.",
    amount: 2500,
    scope: "grade",
    gradeLevel: "Form 4",
    category: "activity",
    academicYear: 2026,
    term: 3,
    dueDate: "2026-09-01",
    issuedDate: "2026-06-15",
    issuedBy: "Daniel Njoroge",
    status: "active",
  },
];

export const levyPayments: LevyPayment[] = [
  {
    id: "lp-1",
    levyId: "lvy-3",
    levyTitle: "Term 2 School Magazine",
    studentId: "std-1",
    studentName: "Amina Kamau",
    amount: 350,
    paidAt: "2026-06-15T09:00:00Z",
    paymentMethod: "mpesa",
    mpesaCode: "QRF1234567",
    receiptNumber: "LVR-001",
    recordedBy: "Agnes Kariuki",
  },
  {
    id: "lp-2",
    levyId: "lvy-5",
    levyTitle: "Replacement School Diary",
    studentId: "std-1",
    studentName: "Amina Kamau",
    amount: 200,
    paidAt: "2026-06-18T14:30:00Z",
    paymentMethod: "cash",
    receiptNumber: "LVR-002",
    recordedBy: "Agnes Kariuki",
  },
  {
    id: "lp-3",
    levyId: "lvy-2",
    levyTitle: "Grade 7 CBC Science Kit",
    studentId: "std-3",
    studentName: "Christine Mwangi",
    amount: 1200,
    paidAt: "2026-06-12T10:00:00Z",
    paymentMethod: "mpesa",
    mpesaCode: "QRE9876543",
    receiptNumber: "LVR-003",
    recordedBy: "Agnes Kariuki",
  },
];

export const auditLogs: AuditLog[] = [
  { id: "au-1", userId: "usr-4", userName: "Agnes Kariuki", action: "create", module: "Fees", details: "Recorded payment RCP-2026-00891 of KES 12,500.00", ipAddress: "197.232.45.12", timestamp: "2026-06-10T09:15:00Z" },
  { id: "au-2", userId: "usr-1", userName: "Daniel Njoroge", action: "update", module: "Settings", details: "Updated current term to Term 2, 2026", ipAddress: "197.232.45.10", timestamp: "2026-06-09T08:00:00Z" },
  { id: "au-3", userId: "usr-3", userName: "John Kivuva", action: "create", module: "Attendance", details: "Submitted attendance for Form 1 A", ipAddress: "197.232.45.18", timestamp: "2026-06-10T08:30:00Z" },
  { id: "au-4", userId: "usr-2", userName: "Joseph Mutua", action: "auth", module: "Authentication", details: "User signed in", ipAddress: "197.232.45.11", timestamp: "2026-06-10T07:50:00Z" },
  { id: "au-5", userId: "usr-1", userName: "Daniel Njoroge", action: "delete", module: "Students", details: "Archived transferred student record", ipAddress: "197.232.45.10", timestamp: "2026-06-05T14:20:00Z" },
];
export const termEvents: TermEvent[] = [
  {
    id: "te-1",
    title: "Term 2 Opener Exams",
    description: "Beginning of term assessment for all levels.",
    category: "exam",
    scope: "school",
    startDate: "2026-05-13",
    endDate: "2026-05-17",
    isRange: true,
    term: 2,
    year: 2026,
    examId: "exm-1",
    visibleToParents: true,
    approvalStatus: "approved",
    createdBy: "usr-1",
    createdByName: "Mr. Daniel Kamau",
    createdAt: "2026-05-01T08:00:00Z",
  },
  {
    id: "te-2",
    title: "Madaraka Day Holiday",
    category: "holiday",
    scope: "school",
    startDate: "2026-06-01",
    endDate: "2026-06-01",
    isRange: false,
    term: 2,
    year: 2026,
    visibleToParents: true,
    approvalStatus: "approved",
    createdBy: "usr-1",
    createdByName: "Mr. Daniel Kamau",
    createdAt: "2026-05-01T08:00:00Z",
  },
  {
    id: "te-3",
    title: "Term 2 Mid-Term Exams",
    category: "exam",
    scope: "school",
    startDate: "2026-06-17",
    endDate: "2026-06-21",
    isRange: true,
    term: 2,
    year: 2026,
    examId: "exm-2",
    visibleToParents: true,
    approvalStatus: "approved",
    createdBy: "usr-1",
    createdByName: "Mr. Daniel Kamau",
    createdAt: "2026-05-01T08:00:00Z",
  },
  {
    id: "te-4",
    title: "Mid-Term Break",
    category: "holiday",
    scope: "school",
    startDate: "2026-06-22",
    endDate: "2026-06-27",
    isRange: true,
    term: 2,
    year: 2026,
    visibleToParents: true,
    approvalStatus: "approved",
    createdBy: "usr-1",
    createdByName: "Mr. Daniel Kamau",
    createdAt: "2026-05-01T08:00:00Z",
  },
  {
    id: "te-5",
    title: "Parents' Consultation Day",
    description: "Opportunity for parents to discuss academic progress with teachers.",
    category: "meeting",
    scope: "school",
    startDate: "2026-07-04",
    endDate: "2026-07-04",
    isRange: false,
    term: 2,
    year: 2026,
    visibleToParents: true,
    approvalStatus: "approved",
    createdBy: "usr-1",
    createdByName: "Mr. Daniel Kamau",
    createdAt: "2026-05-01T08:00:00Z",
  },
  {
    id: "te-6",
    title: "Sports Day",
    description: "Annual inter-house sports competitions.",
    category: "activity",
    scope: "school",
    startDate: "2026-07-11",
    endDate: "2026-07-11",
    isRange: false,
    term: 2,
    year: 2026,
    visibleToParents: true,
    approvalStatus: "approved",
    createdBy: "usr-1",
    createdByName: "Mr. Daniel Kamau",
    createdAt: "2026-05-01T08:00:00Z",
  },
  {
    id: "te-7",
    title: "Form 2A Naivasha Trip",
    category: "trip",
    scope: "class",
    classId: "cls-7",
    className: "Form 2 A",
    startDate: "2026-07-18",
    endDate: "2026-07-19",
    isRange: true,
    term: 2,
    year: 2026,
    visibleToParents: true,
    approvalStatus: "approved",
    createdBy: "usr-3",
    createdByName: "Mr. John Kivuva",
    createdAt: "2026-06-10T10:00:00Z",
  },
  {
    id: "te-8",
    title: "Term 2 Fee Payment Deadline",
    category: "deadline",
    scope: "school",
    startDate: "2026-07-15",
    endDate: "2026-07-15",
    isRange: false,
    term: 2,
    year: 2026,
    visibleToParents: true,
    approvalStatus: "approved",
    createdBy: "usr-1",
    createdByName: "Mr. Daniel Kamau",
    createdAt: "2026-05-01T08:00:00Z",
  },
  {
    id: "te-9",
    title: "Term 2 End-Term Exams",
    category: "exam",
    scope: "school",
    startDate: "2026-08-05",
    endDate: "2026-08-09",
    isRange: true,
    term: 2,
    year: 2026,
    examId: "exm-3",
    visibleToParents: true,
    approvalStatus: "approved",
    createdBy: "usr-1",
    createdByName: "Mr. Daniel Kamau",
    createdAt: "2026-05-01T08:00:00Z",
  },
  {
    id: "te-10",
    title: "Term 2 Closing Day",
    category: "closure",
    scope: "school",
    startDate: "2026-08-09",
    endDate: "2026-08-09",
    isRange: false,
    term: 2,
    year: 2026,
    visibleToParents: true,
    approvalStatus: "approved",
    createdBy: "usr-1",
    createdByName: "Mr. Daniel Kamau",
    createdAt: "2026-05-01T08:00:00Z",
  },
  {
    id: "te-11",
    title: "Grade 8 Science Fair",
    category: "activity",
    scope: "grade",
    gradeLevel: "Grade 8",
    startDate: "2026-07-25",
    endDate: "2026-07-25",
    isRange: false,
    term: 2,
    year: 2026,
    visibleToParents: false,
    approvalStatus: "pending_approval",
    createdBy: "usr-5", // Assuming a teacher ID
    createdByName: "Ms. Beatrice Ouma",
    createdAt: "2026-06-15T09:00:00Z",
  },
  {
    id: "te-12",
    title: "Form 3 Mock Revision Week",
    category: "exam",
    scope: "grade",
    gradeLevel: "Form 3",
    startDate: "2026-07-28",
    endDate: "2026-08-01",
    isRange: true,
    term: 2,
    year: 2026,
    visibleToParents: false,
    approvalStatus: "draft",
    createdBy: "usr-6", // Assuming a teacher ID
    createdByName: "Mr. Samuel Otieno",
    createdAt: "2026-06-20T11:00:00Z",
  },
];

/**
 * Domain data hooks — thin wrappers around the real API client.
 * @module hooks/domain
 */
import { useAsync } from "./useAsync";
import { api } from "@/lib/api";

/** Fetch students with optional filters. */
export function useStudents(filters) {
  return useAsync(() => api.getStudents(filters), [JSON.stringify(filters)]);
}

/** Fetch a single student by id. */
export function useStudent(id) {
  return useAsync(() => api.getStudent(id), [id]);
}

/** Fetch all classes. */
export function useClasses() {
  return useAsync(() => api.getClasses(), []);
}

/** Fetch all staff with optional filters. */
export function useStaff(filters) {
  return useAsync(() => api.getStaff(filters), [JSON.stringify(filters)]);
}

/** Fetch a single staff member by id. */
export function useStaffMember(id) {
  return useAsync(() => api.getStaffById(id), [id]);
}

/** Fetch fee collection summary. */
export function useFees() {
  return useAsync(() => api.getFeeCollectionSummary(), []);
}

/** Fetch payroll for a month/year. */
export function usePayroll(month, year) {
  return useAsync(() => api.getPayroll(month, year), [month, year]);
}

/** Fetch exams with optional filters. */
export function useExams(filters) {
  return useAsync(() => api.getExams(filters), [JSON.stringify(filters)]);
}

/**
 * Fetch attendance records for a class within an inclusive date range.
 * @param {string} classId
 * @param {string} dateFrom - ISO date string "YYYY-MM-DD"
 * @param {string} dateTo   - ISO date string "YYYY-MM-DD"
 */
export function useAttendanceRange(classId, dateFrom, dateTo) {
  return useAsync(
    () => (classId && dateFrom && dateTo ? api.getAttendance(classId, dateFrom, dateTo) : Promise.resolve([])),
    [classId, dateFrom, dateTo]
  );
}

/**
 * Fetch per-day attendance summary counts for a class.
 * @param {string} classId
 * @param {string} dateFrom - ISO date string "YYYY-MM-DD"
 * @param {string} dateTo   - ISO date string "YYYY-MM-DD"
 */
export function useAttendanceSummary(classId, dateFrom, dateTo) {
  return useAsync(
    () => (classId && dateFrom && dateTo ? api.getAttendanceSummary(classId, dateFrom, dateTo) : Promise.resolve([])),
    [classId, dateFrom, dateTo]
  );
}

/**
 * Fetch attendance records for a single student across a date range.
 * @param {string} studentId
 * @param {string} dateFrom
 * @param {string} dateTo
 */
export function useStudentAttendance(studentId, dateFrom, dateTo) {
  return useAsync(
    () => (studentId ? api.getStudentAttendance(studentId, dateFrom, dateTo) : Promise.resolve([])),
    [studentId, dateFrom, dateTo]
  );
}

/** Fetch report cards for a class/exam. */
export function useReportCards(examId, classId) {
  return useAsync(
    () => (classId && examId ? api.generateReportCards(examId, classId) : Promise.resolve([])),
    [examId, classId]
  );
}

/** Fetch a single student's report card for an exam. */
export function useStudentReportCard(studentId, examId) {
  return useAsync(
    () => (studentId && examId ? api.getStudentReportCard(studentId, examId) : Promise.resolve(null)),
    [studentId, examId]
  );
}

/** Fetch per-subject performance stats for a class/exam. */
export function useClassPerformanceReport(classId, examId) {
  return useAsync(
    () => (classId && examId ? api.getClassPerformanceReport(classId, examId) : Promise.resolve({ subjectStats: [] })),
    [classId, examId]
  );
}

/** Fetch school-wide performance trend across published exams. */
export function useSchoolPerformanceTrend() {
  return useAsync(() => api.getSchoolPerformanceTrend(), []);
}

/** Fetch school profile/settings. */
export function useSchool() {
  return useAsync(() => api.getSchool(), []);
}
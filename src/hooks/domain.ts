/**
 * Domain data hooks built on top of the mock API.
 * @module hooks/domain
 */
import { useAsync } from "./useAsync";
import * as api from "@/lib/mockApi";

/** Fetch students with optional filters. */
export function useStudents(filters?: Parameters<typeof api.getStudents>[0]) {
  return useAsync(() => api.getStudents(filters), [JSON.stringify(filters)]);
}
/** Fetch a single student by id. */
export function useStudent(id: string) {
  return useAsync(() => api.getStudentById(id), [id]);
}
/** Fetch all classes. */
export function useClasses() {
  return useAsync(() => api.getClasses(), []);
}
/** Fetch staff with optional filters. */
export function useStaff(filters?: Parameters<typeof api.getStaff>[0]) {
  return useAsync(() => api.getStaff(filters), [JSON.stringify(filters)]);
}
/** Fetch fee collection summary. */
export function useFees() {
  return useAsync(() => api.getFeeCollectionSummary(), []);
}
/** Fetch payroll for a month/year. */
export function usePayroll(month: number, year: number) {
  return useAsync(() => api.getPayroll(month, year), [month, year]);
}
/** Fetch exams with optional filters. */
export function useExams(filters?: Parameters<typeof api.getExams>[0]) {
  return useAsync(() => api.getExams(filters), [JSON.stringify(filters)]);
}
/** Fetch attendance for a class and date. */
export function useAttendance(classId: string, date: string) {
  return useAsync(() => api.getAttendance(classId, date), [classId, date]);
}
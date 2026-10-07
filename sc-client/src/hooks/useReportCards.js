// hooks/domain/useReportCard.js
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";

export function useReportCard(studentId, year, term) {
  return useAsync(
    () =>
      studentId && year && term
        ? api.exams.getReportCard(studentId, year, term)
        : Promise.resolve(null),
    [studentId, year, term]
  );
}

export function useReportCardsList(studentId) {
  return useAsync(
    () => (studentId ? api.exams.listReportCards(studentId) : Promise.resolve([])),
    [studentId]
  );
}

export function useClassReportCards(classId, year, term) {
  return useAsync(
    () =>
      classId && year && term
        ? api.exams.getClassReportCards(classId, year, term)
        : Promise.resolve([]),
    [classId, year, term]
  );
}

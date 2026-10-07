import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";

export function useReportCard(studentId, year, term) {
  return useAsync(
    () =>
      studentId && year && term
        ? api.getReportCard(studentId, year, term)
        : Promise.resolve(null),
    [studentId, year, term]
  );
}

import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";

export function useReportCards(examId, classId) {
  return useAsync(
    () => (classId && examId ? api.generateReportCards(examId, classId) : Promise.resolve([])),
    [examId, classId]
  );
}

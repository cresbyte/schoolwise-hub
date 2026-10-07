import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";

export function useExamScores(examSubjectId) {
  return useAsync(
    () => (examSubjectId ? api.getExamSubjectScores(examSubjectId) : Promise.resolve([])),
    [examSubjectId]
  );
}

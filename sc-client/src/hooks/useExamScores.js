// hooks/domain/useExamScores.js
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";

export function useExamScores(examSubjectId) {
  return useAsync(
    () => (examSubjectId ? api.exams.getScores(examSubjectId) : Promise.resolve([])),
    [examSubjectId]
  );
}

export function useSaveExamScores() {
  return async (examSubjectId, scores) => {
    return api.exams.saveScores(examSubjectId, scores);
  };
}

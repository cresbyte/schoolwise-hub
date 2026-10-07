// hooks/domain/useExams.js
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";

export function useExams(params = {}) {
  return useAsync(() => api.exams.list(params), [
    params.year,
    params.term,
    params.status,
  ]);
}

export function useExam(id) {
  return useAsync(() => (id ? api.exams.get(id) : Promise.resolve(null)), [id]);
}

import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";

export function useExams(filters) {
  return useAsync(() => api.getExams(filters), [JSON.stringify(filters)]);
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "../../api/axiosClient.js";

export function useOptimizationRuns(strategy) {
  return useQuery({ queryKey: ["optimizations", strategy], queryFn: async () => (await axiosClient.get("/optimizations", { params: { strategy } })).data, enabled: !!strategy });
}
export function useCreateOptimizationRun() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (p) => (await axiosClient.post("/optimizations", p)).data, onSuccess: () => qc.invalidateQueries({ queryKey: ["optimizations"] }) });
}
export function useDeleteOptimizationRun() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (id) => (await axiosClient.delete(`/optimizations/${id}`)).data, onSuccess: () => qc.invalidateQueries({ queryKey: ["optimizations"] }) });
}

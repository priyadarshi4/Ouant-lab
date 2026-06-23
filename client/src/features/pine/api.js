import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "../../api/axiosClient.js";

export function useAnalyzePineScript() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await axiosClient.post("/pine/analyze", payload)).data,
    onSuccess: (_, vars) => { if (vars.strategyId) qc.invalidateQueries({ queryKey: ["strategy", vars.strategyId] }); },
  });
}

export function useApplyPineScriptAnalysis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (strategyId) => (await axiosClient.post("/pine/apply", { strategyId })).data,
    onSuccess: (_, strategyId) => qc.invalidateQueries({ queryKey: ["strategy", strategyId] }),
  });
}

export function useGenerateAiAnalysis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (strategyId) => (await axiosClient.post(`/strategies/${strategyId}/ai-analysis`)).data,
    onSuccess: (_, strategyId) => qc.invalidateQueries({ queryKey: ["strategy", strategyId] }),
  });
}

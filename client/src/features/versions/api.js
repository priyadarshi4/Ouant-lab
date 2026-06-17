import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "../../api/axiosClient.js";

export function useVersionHistory(strategyId) {
  return useQuery({
    queryKey: ["versionHistory", strategyId],
    queryFn: async () => (await axiosClient.get(`/strategies/${strategyId}/versions`)).data,
    enabled: !!strategyId,
  });
}

export function useRollbackVersion(strategyId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (snapshotId) =>
      (await axiosClient.post(`/strategies/${strategyId}/versions/${snapshotId}/rollback`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["strategy", strategyId] });
      qc.invalidateQueries({ queryKey: ["versionHistory", strategyId] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "../../api/axiosClient.js";

export function useBacktests(filters = {}) {
  return useQuery({
    queryKey: ["backtests", filters],
    queryFn: async () => (await axiosClient.get("/backtests", { params: filters })).data,
  });
}

export function useBacktest(id) {
  return useQuery({
    queryKey: ["backtest", id],
    queryFn: async () => (await axiosClient.get(`/backtests/${id}`)).data,
    enabled: !!id,
  });
}

export function useCreateBacktest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await axiosClient.post("/backtests", payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["backtests"] });
      qc.invalidateQueries({ queryKey: ["strategy"] });
    },
  });
}

export function useUpdateBacktest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => (await axiosClient.put(`/backtests/${id}`, payload)).data,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["backtests"] });
      qc.invalidateQueries({ queryKey: ["backtest", vars.id] });
    },
  });
}

export function useDeleteBacktest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await axiosClient.delete(`/backtests/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["backtests"] }),
  });
}

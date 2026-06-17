import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "../../api/axiosClient.js";

export function useStrategies(filters = {}) {
  return useQuery({
    queryKey: ["strategies", filters],
    queryFn: async () => {
      const { data } = await axiosClient.get("/strategies", { params: filters });
      return data;
    },
  });
}

export function useStrategy(id) {
  return useQuery({
    queryKey: ["strategy", id],
    queryFn: async () => {
      const { data } = await axiosClient.get(`/strategies/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateStrategy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await axiosClient.post("/strategies", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["strategies"] }),
  });
}

export function useUpdateStrategy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => (await axiosClient.put(`/strategies/${id}`, payload)).data,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["strategies"] });
      qc.invalidateQueries({ queryKey: ["strategy", vars.id] });
    },
  });
}

export function useDeleteStrategy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await axiosClient.delete(`/strategies/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["strategies"] }),
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await axiosClient.patch(`/strategies/${id}/favorite`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["strategies"] }),
  });
}

export function useUpdateScorecard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) =>
      (await axiosClient.patch(`/strategies/${id}/scorecard`, payload)).data,
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["strategy", vars.id] }),
  });
}

export function useCompareStrategies() {
  return useMutation({
    mutationFn: async (ids) => (await axiosClient.post("/strategies/compare", { ids })).data,
  });
}

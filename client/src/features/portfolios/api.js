import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "../../api/axiosClient.js";

export function usePortfolios() {
  return useQuery({ queryKey: ["portfolios"], queryFn: async () => (await axiosClient.get("/portfolios")).data });
}
export function usePortfolio(id) {
  return useQuery({ queryKey: ["portfolio", id], queryFn: async () => (await axiosClient.get(`/portfolios/${id}`)).data, enabled: !!id });
}
export function usePortfolioAnalytics(id) {
  return useQuery({ queryKey: ["portfolio-analytics", id], queryFn: async () => (await axiosClient.get(`/portfolios/${id}/analytics`)).data, enabled: !!id });
}
export function useRegimeAnalysis(id) {
  return useQuery({ queryKey: ["regime-analysis", id], queryFn: async () => (await axiosClient.get(`/portfolios/${id}/regime-analysis`)).data, enabled: !!id });
}
export function useCreatePortfolio() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (payload) => (await axiosClient.post("/portfolios", payload)).data, onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolios"] }) });
}
export function useUpdatePortfolio() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async ({ id, ...p }) => (await axiosClient.put(`/portfolios/${id}`, p)).data, onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolios"] }) });
}
export function useDeletePortfolio() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (id) => (await axiosClient.delete(`/portfolios/${id}`)).data, onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolios"] }) });
}
export function useComputeAllocation() {
  return useMutation({ mutationFn: async ({ id, method }) => (await axiosClient.post(`/portfolios/${id}/allocate`, { method })).data });
}

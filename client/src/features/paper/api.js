import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "../../api/axiosClient.js";

export function usePaperAccounts() {
  return useQuery({ queryKey: ["paperAccounts"], queryFn: async () => (await axiosClient.get("/paper")).data });
}
export function usePaperAccount(id) {
  return useQuery({ queryKey: ["paperAccount", id], queryFn: async () => (await axiosClient.get(`/paper/${id}`)).data, enabled: !!id });
}
export function useCreatePaperAccount() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (p) => (await axiosClient.post("/paper", p)).data, onSuccess: () => qc.invalidateQueries({ queryKey: ["paperAccounts"] }) });
}
export function useUpdatePaperAccount() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async ({ id, ...p }) => (await axiosClient.put(`/paper/${id}`, p)).data, onSuccess: () => { qc.invalidateQueries({ queryKey: ["paperAccounts"] }); qc.invalidateQueries({ queryKey: ["paperAccount"] }); } });
}
export function useDeletePaperAccount() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (id) => (await axiosClient.delete(`/paper/${id}`)).data, onSuccess: () => qc.invalidateQueries({ queryKey: ["paperAccounts"] }) });
}
export function useManualSignal(id) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (payload) => (await axiosClient.post(`/paper/${id}/signal`, payload)).data, onSuccess: () => qc.invalidateQueries({ queryKey: ["paperAccount", id] }) });
}
export function useSignals(id) {
  return useQuery({ queryKey: ["signals", id], queryFn: async () => (await axiosClient.get(`/paper/${id}/signals`)).data, enabled: !!id });
}
export function useTradeJournal(id) {
  return useQuery({ queryKey: ["tradeJournal", id], queryFn: async () => (await axiosClient.get(`/paper/${id}/journal`)).data, enabled: !!id });
}
export function useUpdateJournalEntry(accountId) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async ({ entryId, ...p }) => (await axiosClient.put(`/paper/${accountId}/journal/${entryId}`, p)).data, onSuccess: () => qc.invalidateQueries({ queryKey: ["tradeJournal", accountId] }) });
}
export function useAiReviewTrade(accountId) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (entryId) => (await axiosClient.post(`/paper/${accountId}/journal/${entryId}/ai-review`)).data, onSuccess: () => qc.invalidateQueries({ queryKey: ["tradeJournal", accountId] }) });
}

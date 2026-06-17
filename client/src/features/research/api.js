import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "../../api/axiosClient.js";

export function useResearchNotes(filters = {}) {
  return useQuery({
    queryKey: ["researchNotes", filters],
    queryFn: async () => (await axiosClient.get("/research-notes", { params: filters })).data,
  });
}

export function useCreateResearchNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await axiosClient.post("/research-notes", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["researchNotes"] }),
  });
}

export function useUpdateResearchNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => (await axiosClient.put(`/research-notes/${id}`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["researchNotes"] }),
  });
}

export function useDeleteResearchNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await axiosClient.delete(`/research-notes/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["researchNotes"] }),
  });
}

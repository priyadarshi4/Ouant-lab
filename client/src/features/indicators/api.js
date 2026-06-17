import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "../../api/axiosClient.js";

export function useIndicators() {
  return useQuery({
    queryKey: ["indicators"],
    queryFn: async () => (await axiosClient.get("/indicators")).data,
  });
}

export function useCreateIndicator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await axiosClient.post("/indicators", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["indicators"] }),
  });
}

export function useDeleteIndicator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await axiosClient.delete(`/indicators/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["indicators"] }),
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "../../api/axiosClient.js";

export function useCodeVersions(strategy) {
  return useQuery({
    queryKey: ["codeVersions", strategy],
    queryFn: async () => (await axiosClient.get("/code-versions", { params: { strategy } })).data,
  });
}

export function useCreateCodeVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await axiosClient.post("/code-versions", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["codeVersions"] }),
  });
}

export function useDeleteCodeVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await axiosClient.delete(`/code-versions/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["codeVersions"] }),
  });
}

export function useDiffCodeVersions(a, b) {
  return useQuery({
    queryKey: ["codeDiff", a, b],
    queryFn: async () => (await axiosClient.get("/code-versions/diff", { params: { a, b } })).data,
    enabled: !!a && !!b,
  });
}

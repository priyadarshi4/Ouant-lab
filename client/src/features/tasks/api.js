import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "../../api/axiosClient.js";

export function useTasks(filters = {}) {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: async () => (await axiosClient.get("/tasks", { params: filters })).data,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await axiosClient.post("/tasks", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => (await axiosClient.put(`/tasks/${id}`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await axiosClient.delete(`/tasks/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useSuggestTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (strategyId) => (await axiosClient.post("/tasks/suggest", { strategy: strategyId })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

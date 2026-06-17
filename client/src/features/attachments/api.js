import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "../../api/axiosClient.js";

export function useAttachments(filters = {}) {
  return useQuery({
    queryKey: ["attachments", filters],
    queryFn: async () => (await axiosClient.get("/attachments", { params: filters })).data,
  });
}

export function useUploadAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, ...fields }) => {
      const form = new FormData();
      form.append("file", file);
      Object.entries(fields).forEach(([k, v]) => v != null && form.append(k, v));
      const { data } = await axiosClient.post("/attachments", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attachments"] }),
  });
}

export function useDeleteAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await axiosClient.delete(`/attachments/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attachments"] }),
  });
}

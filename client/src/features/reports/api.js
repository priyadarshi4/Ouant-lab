import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "../../api/axiosClient.js";

export function useReports(strategy) {
  return useQuery({
    queryKey: ["reports", strategy],
    queryFn: async () => (await axiosClient.get("/reports", { params: { strategy } })).data,
  });
}

export function useCreateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await axiosClient.post("/reports", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}

export function useDeleteReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await axiosClient.delete(`/reports/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}

export async function downloadReportPdf(id, title) {
  const res = await axiosClient.get(`/reports/${id}/pdf`, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${title || "report"}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

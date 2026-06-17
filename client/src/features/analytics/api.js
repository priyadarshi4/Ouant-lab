import { useQuery } from "@tanstack/react-query";
import axiosClient from "../../api/axiosClient.js";

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: async () => (await axiosClient.get("/analytics/dashboard")).data,
  });
}

export function useCorrelationMatrix() {
  return useQuery({
    queryKey: ["correlationMatrix"],
    queryFn: async () => (await axiosClient.get("/analytics/correlation")).data,
  });
}

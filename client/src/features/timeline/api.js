import { useQuery } from "@tanstack/react-query";
import axiosClient from "../../api/axiosClient.js";

export function useTimeline(strategy) {
  return useQuery({
    queryKey: ["timeline", strategy],
    queryFn: async () => (await axiosClient.get("/timeline", { params: { strategy } })).data,
    enabled: !!strategy,
  });
}

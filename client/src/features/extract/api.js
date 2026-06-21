import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "../../api/axiosClient.js";

export function useExtractFromScreenshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, backtestId }) => {
      const form = new FormData();
      form.append("file", file);
      if (backtestId) form.append("backtestId", backtestId);
      const { data } = await axiosClient.post("/extract/screenshot", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: (_, vars) => {
      if (vars.backtestId) {
        qc.invalidateQueries({ queryKey: ["backtest", vars.backtestId] });
        qc.invalidateQueries({ queryKey: ["backtests"] });
      }
    },
  });
}

export function useImportEquityCsv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, backtestId }) => {
      const form = new FormData();
      form.append("file", file);
      form.append("backtestId", backtestId);
      const { data } = await axiosClient.post("/extract/equity-csv", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["backtest", vars.backtestId] });
    },
  });
}

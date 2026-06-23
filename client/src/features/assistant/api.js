import { useMutation } from "@tanstack/react-query";
import axiosClient from "../../api/axiosClient.js";

export function useAssistantChat() {
  return useMutation({
    mutationFn: async ({ message, conversationHistory }) =>
      (await axiosClient.post("/assistant/chat", { message, conversationHistory })).data,
  });
}

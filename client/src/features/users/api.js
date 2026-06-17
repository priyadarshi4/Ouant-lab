import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import axiosClient from "../../api/axiosClient.js";
import { fetchMe } from "../auth/authSlice.js";

export function useUpdateProfile() {
  const dispatch = useDispatch();
  return useMutation({
    mutationFn: async (payload) => (await axiosClient.put("/users/me", payload)).data,
    onSuccess: () => dispatch(fetchMe()),
  });
}

function useImageUpload(endpoint) {
  const dispatch = useDispatch();
  return useMutation({
    mutationFn: async (file) => {
      const form = new FormData();
      form.append("file", file);
      const { data } = await axiosClient.post(endpoint, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: () => dispatch(fetchMe()),
  });
}

export const useUpdateAvatar = () => useImageUpload("/users/me/avatar");
export const useUpdateBanner = () => useImageUpload("/users/me/banner");

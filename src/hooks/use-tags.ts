"use client";

import { useApi } from "./use-api";
import { apiRequest } from "@/lib/api-client";
import { useCallback } from "react";

export function useTags() {
  const { data, error, isLoading, mutate } = useApi<unknown[]>("/api/tags");

  const createTag = useCallback(async (name: string) => {
    const result = await apiRequest("/api/tags", { body: { name } });
    await mutate();
    return result;
  }, [mutate]);

  const deleteTag = useCallback(async (id: string) => {
    const result = await apiRequest(`/api/tags?id=${id}`, { method: "DELETE" });
    await mutate();
    return result;
  }, [mutate]);

  return { tags: data, error, isLoading, mutate, createTag, deleteTag };
}

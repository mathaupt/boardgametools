"use client";

import { useApi } from "./use-api";
import { apiRequest } from "@/lib/api-client";
import { useCallback } from "react";

export function useGroups() {
  const { data, error, isLoading, mutate } = useApi<unknown[]>("/api/groups");

  const createGroup = useCallback(async (input: Record<string, unknown>) => {
    const result = await apiRequest("/api/groups", { body: input });
    await mutate();
    return result;
  }, [mutate]);

  const deleteGroup = useCallback(async (id: string) => {
    const result = await apiRequest(`/api/groups/${id}`, { method: "DELETE" });
    await mutate();
    return result;
  }, [mutate]);

  return { groups: data, error, isLoading, mutate, createGroup, deleteGroup };
}

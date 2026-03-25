"use client";

import { useApi } from "./use-api";
import { apiRequest } from "@/lib/api-client";
import { useCallback } from "react";

export function useSessions() {
  const { data, error, isLoading, mutate } = useApi<unknown[]>("/api/sessions");

  const createSession = useCallback(async (input: Record<string, unknown>) => {
    const result = await apiRequest("/api/sessions", { body: input });
    await mutate();
    return result;
  }, [mutate]);

  const deleteSession = useCallback(async (id: string) => {
    const result = await apiRequest(`/api/sessions/${id}`, { method: "DELETE" });
    await mutate();
    return result;
  }, [mutate]);

  return { sessions: data, error, isLoading, mutate, createSession, deleteSession };
}

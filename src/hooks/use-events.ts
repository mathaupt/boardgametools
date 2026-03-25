"use client";

import { useApi } from "./use-api";
import { apiRequest } from "@/lib/api-client";
import { useCallback } from "react";

export function useEvents() {
  const { data, error, isLoading, mutate } = useApi<unknown[]>("/api/events");

  const createEvent = useCallback(async (input: Record<string, unknown>) => {
    const result = await apiRequest("/api/events", { body: input });
    await mutate();
    return result;
  }, [mutate]);

  return { events: data, error, isLoading, mutate, createEvent };
}

export function useEvent(id: string | null) {
  return useApi<unknown>(id ? `/api/events/${id}` : null);
}

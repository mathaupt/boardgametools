"use client";

import { useApi } from "./use-api";
import { apiRequest } from "@/lib/api-client";
import { useCallback } from "react";

export function useSeries() {
  const { data, error, isLoading, mutate } = useApi<unknown[]>("/api/series");

  const createSeries = useCallback(async (input: Record<string, unknown>) => {
    const result = await apiRequest("/api/series", { body: input });
    await mutate();
    return result;
  }, [mutate]);

  return { series: data, error, isLoading, mutate, createSeries };
}

export function useSeriesDetail(id: string | null) {
  return useApi<unknown>(id ? `/api/series/${id}` : null);
}

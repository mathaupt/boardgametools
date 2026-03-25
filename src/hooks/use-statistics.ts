"use client";

import { useApi } from "./use-api";

export function useStatistics() {
  const { data, error, isLoading, mutate } = useApi<unknown>("/api/statistics", {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  return { statistics: data, error, isLoading, mutate };
}

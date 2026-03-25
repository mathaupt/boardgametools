"use client";

import useSWR, { SWRConfiguration } from "swr";
import { fetcher } from "@/lib/api-client";

/**
 * Generic SWR hook for any API endpoint.
 * Returns { data, error, isLoading, mutate }.
 */
export function useApi<T>(url: string | null, config?: SWRConfiguration<T>) {
  return useSWR<T>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
    ...config,
  });
}

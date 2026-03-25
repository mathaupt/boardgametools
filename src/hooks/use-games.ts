"use client";

import { useApi } from "./use-api";
import { apiRequest } from "@/lib/api-client";
import { useCallback } from "react";

export function useGames() {
  const { data, error, isLoading, mutate } = useApi<unknown[]>("/api/games");

  const createGame = useCallback(async (input: Record<string, unknown>) => {
    const result = await apiRequest("/api/games", { body: input });
    await mutate();
    return result;
  }, [mutate]);

  const updateGame = useCallback(async (id: string, input: Record<string, unknown>) => {
    const result = await apiRequest(`/api/games/${id}`, { method: "PUT", body: input });
    await mutate();
    return result;
  }, [mutate]);

  const deleteGame = useCallback(async (id: string) => {
    const result = await apiRequest(`/api/games/${id}`, { method: "DELETE" });
    await mutate();
    return result;
  }, [mutate]);

  return { games: data, error, isLoading, mutate, createGame, updateGame, deleteGame };
}

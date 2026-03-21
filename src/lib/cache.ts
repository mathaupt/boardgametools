import { unstable_cache } from "next/cache";

export function cachedQuery<T>(
  queryFn: () => Promise<T>,
  keyParts: string[],
  options?: { revalidate?: number; tags?: string[] }
): Promise<T> {
  return unstable_cache(queryFn, keyParts, {
    revalidate: options?.revalidate ?? 60,
    tags: options?.tags,
  })();
}

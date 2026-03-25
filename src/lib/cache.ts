import { unstable_cache, revalidateTag as nextRevalidateTag } from "next/cache";

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

/**
 * Invalidate a cache tag immediately.
 * Wraps Next.js 16 revalidateTag which requires a profile parameter.
 */
export function invalidateTag(tag: string): void {
  nextRevalidateTag(tag, "default");
}

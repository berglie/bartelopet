import type { PostgrestError } from '@supabase/supabase-js';

/** Supabase's API returns at most 1000 rows per request, so larger lists are fetched in pages. */
const PAGE_SIZE = 1000;

/**
 * Fetches every row of a query by paging with `range()`. The query must have a stable order
 * (end with a unique column such as `id`), or rows can be skipped or repeated between pages.
 */
export async function fetchAll<T>(
  page: (
    from: number,
    to: number
  ) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>
): Promise<{ data: T[]; error: PostgrestError | null }> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) return { data: rows, error };
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return { data: rows, error: null };
  }
}

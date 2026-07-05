import type { QueryClient, QueryKey } from '@tanstack/react-query'

/**
 * Immutably update the items of a cached list that match `predicate`.
 * No-op when the query has no cached data.
 */
export const updateListItem = <T>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  predicate: (item: T) => boolean,
  update: (item: T) => T,
) => {
  queryClient.setQueryData<Array<T>>(queryKey, (old) =>
    old?.map((item) => (predicate(item) ? update(item) : item)),
  )
}

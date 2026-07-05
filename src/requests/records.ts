import { queryOptions } from '@tanstack/react-query'

import type { paths } from '@/api/schema.gen'
import type { SuccessData } from '@/api/types.ts'
import { client } from '@/api/client.ts'
import { toApiError, unwrapData } from '@/api/errors.ts'

export type ChildRecord = SuccessData<
  paths['/api/records/']['get']
>['records'][number]

export const fetchChildRecords = async (
  childId: number,
): Promise<Array<ChildRecord>> => {
  const { data, error, response } = await client.GET('/api/records/', {
    params: { query: { childId } },
  })
  if (error !== undefined) throw toApiError(response.status, error)
  return unwrapData(data).records
}

export const childRecordsQueryOptions = (childId: number) =>
  queryOptions({
    queryKey: ['records', 'child', childId],
    queryFn: () => fetchChildRecords(childId),
  })

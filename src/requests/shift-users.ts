import { queryOptions } from '@tanstack/react-query'

import type { paths } from '@/api/schema.gen'
import type { SuccessData } from '@/api/types.ts'
import { client } from '@/api/client.ts'
import { toApiError, unwrapData } from '@/api/errors.ts'

export type ShiftUser = SuccessData<
  paths['/api/shifts/{shiftNr}/users']['get']
>['users'][number]

export const fetchShiftUsers = async (
  shiftNr: number,
): Promise<Array<ShiftUser>> => {
  const { data, error, response } = await client.GET(
    '/api/shifts/{shiftNr}/users',
    {
      params: { path: { shiftNr } },
    },
  )
  if (error !== undefined) throw toApiError(response.status, error)
  return unwrapData(data).users
}

export const shiftUsersFetchQueryOptions = (shiftNr: number) =>
  queryOptions({
    queryKey: ['users', shiftNr],
    queryFn: () => fetchShiftUsers(shiftNr),
  })

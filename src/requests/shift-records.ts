import { queryOptions } from '@tanstack/react-query'

import type { paths } from '@/api/schema.gen'
import type { RequestBody, SuccessData } from '@/api/types.ts'
import { client } from '@/api/client.ts'
import { toApiError, unwrapData } from '@/api/errors.ts'

export type CamperRecord = SuccessData<
  paths['/api/shifts/{shiftNr}/records']['get']
>['records'][number]

export type RecordPatchObject = RequestBody<
  paths['/api/records/{recordId}']['patch']
>

export type RecordPathKeys = keyof RecordPatchObject

export const fetchShiftRecords = async (shiftNr: number) => {
  const { data, error, response } = await client.GET(
    '/api/shifts/{shiftNr}/records',
    {
      params: { path: { shiftNr } },
    },
  )
  if (error !== undefined) throw toApiError(response.status, error)
  return unwrapData(data).records
}

export const patchShiftRecord = async (
  recordId: number,
  patch: RecordPatchObject,
) => {
  const { error, response } = await client.PATCH('/api/records/{recordId}', {
    params: { path: { recordId } },
    body: patch,
  })
  if (error !== undefined) throw toApiError(response.status, error)
}

export const shiftRecordsFetchQueryOptions = (shiftNr: number) =>
  queryOptions({
    queryKey: ['records', shiftNr],
    queryFn: () => fetchShiftRecords(shiftNr),
  })

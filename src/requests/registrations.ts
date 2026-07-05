import { queryOptions } from '@tanstack/react-query'

import type { paths } from '@/api/schema.gen'
import type { RequestBody, SuccessData } from '@/api/types.ts'
import { client } from '@/api/client.ts'
import { toApiError, unwrapData } from '@/api/errors.ts'

export type RegistrationEntry = SuccessData<
  paths['/api/registrations/']['get']
>['registrations'][number]

export type Child = RegistrationEntry['child']

export const Sex = { M: 'M', F: 'F' } as const
export type Sex = Child['sex']

export type PatchObject = RequestBody<
  paths['/api/registrations/{regId}']['patch']
>

export type PatchKeys = keyof PatchObject

export const fetchRegistrations = async (
  shiftNr: number,
): Promise<Array<RegistrationEntry>> => {
  const { data, error, response } = await client.GET('/api/registrations/', {
    params: { query: { shiftNr } },
  })
  if (error !== undefined) throw toApiError(response.status, error)
  return unwrapData(data).registrations
}

export const patchRegistrations = async (regId: number, patch: PatchObject) => {
  const { error, response } = await client.PATCH('/api/registrations/{regId}', {
    params: { path: { regId } },
    body: patch,
  })
  if (error !== undefined) throw toApiError(response.status, error)
}

export const fetchShiftPdf = async (shiftNr: number) => {
  const { data, error, response } = await client.GET(
    '/api/shifts/{shiftNr}/pdf',
    {
      params: { path: { shiftNr } },
      parseAs: 'blob',
    },
  )
  if (error !== undefined) throw toApiError(response.status, error)
  return data
}

export const registrationsQueryOptions = (shiftNr: number) =>
  queryOptions({
    queryKey: ['registrations', shiftNr],
    queryFn: () => fetchRegistrations(shiftNr),
  })

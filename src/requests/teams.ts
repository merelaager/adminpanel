import { queryOptions } from '@tanstack/react-query'

import type { paths } from '@/api/schema.gen'
import type { RequestBody, SuccessData } from '@/api/types.ts'
import { client } from '@/api/client.ts'
import { toApiError, unwrapData } from '@/api/errors.ts'

export type TeamRecord = SuccessData<
  paths['/api/teams/']['get']
>['teams'][number]

export type TeamCreationData = RequestBody<paths['/api/teams/']['post']>

export const createShiftTeam = async (shiftNr: number, teamName: string) => {
  const { error, response } = await client.POST('/api/teams/', {
    body: { shiftNr, name: teamName },
  })
  if (error !== undefined) throw toApiError(response.status, error)
}

export const fetchShiftTeams = async (shiftNr: number) => {
  const { data, error, response } = await client.GET('/api/teams/', {
    params: { query: { shiftNr } },
  })
  if (error !== undefined) throw toApiError(response.status, error)
  return unwrapData(data).teams
}

export const shiftTeamsFetchQueryOptions = (shiftNr: number) =>
  queryOptions({
    queryKey: ['teams', shiftNr],
    queryFn: () => fetchShiftTeams(shiftNr),
  })

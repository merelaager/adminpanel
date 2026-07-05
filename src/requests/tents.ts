import { queryOptions } from '@tanstack/react-query'

import type { paths } from '@/api/schema.gen'
import type { SuccessData } from '@/api/types.ts'
import { client } from '@/api/client.ts'
import { toApiError, unwrapData } from '@/api/errors.ts'

export type TentInfo = SuccessData<
  paths['/api/shifts/{shiftNr}/tents/{tentNr}']['get']
>

export type TentScore = TentInfo['scores'][number]

export const fetchTentInfo = async (shiftNr: number, tentNr: number) => {
  const { data, error, response } = await client.GET(
    '/api/shifts/{shiftNr}/tents/{tentNr}',
    { params: { path: { shiftNr, tentNr } } },
  )
  if (error !== undefined) throw toApiError(response.status, error)
  return unwrapData(data)
}

export const fetchTentScores = async (shiftNr: number) => {
  const { data, error, response } = await client.GET(
    '/api/shifts/{shiftNr}/tents',
    {
      params: { path: { shiftNr } },
    },
  )
  if (error !== undefined) throw toApiError(response.status, error)
  return unwrapData(data).scores
}

export const deleteTentScore = async (gradeId: number) => {
  const { error, response } = await client.DELETE('/api/grades/{gradeId}', {
    params: { path: { gradeId } },
  })
  if (error !== undefined) throw toApiError(response.status, error)
}

export const addTentScore = async (
  shiftNr: number,
  tentNr: number,
  score: number,
) => {
  const { data, error, response } = await client.POST(
    '/api/shifts/{shiftNr}/tents/{tentNr}',
    {
      params: { path: { shiftNr, tentNr } },
      body: { score },
    },
  )
  if (error !== undefined) throw toApiError(response.status, error)
  return unwrapData(data)
}

export const shiftTentFetchQueryOptions = (shiftNr: number, tentNr: number) =>
  queryOptions({
    queryKey: ['tent', shiftNr, tentNr],
    queryFn: () => fetchTentInfo(shiftNr, tentNr),
  })

export const shiftTentsFetchQueryOptions = (shiftNr: number) =>
  queryOptions({
    queryKey: ['tents', shiftNr],
    queryFn: () => fetchTentScores(shiftNr),
  })

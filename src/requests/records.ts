import { type Static, Type } from '@sinclair/typebox'
import { queryOptions } from '@tanstack/react-query'
import { StatusCodes } from 'http-status-codes'

import { apiFetch } from '@/api/apiFetch.ts'

const RecordSchema = Type.Object({
  id: Type.Number(),
  childId: Type.Number(),
  childName: Type.String(),
  teamId: Type.Union([Type.Integer(), Type.Null()]),
  teamName: Type.Union([Type.String(), Type.Null()]),
  tentNr: Type.Union([Type.Integer(), Type.Null()]),
  isPresent: Type.Boolean(),
  ageAtCamp: Type.Integer(),
  year: Type.Integer(),
  shiftNr: Type.Integer(),
})

export type Record = Static<typeof RecordSchema>

type RecordsAPISuccessResponse = {
  status: 'success'
  data: {
    records: Record[]
  }
}

export const fetchChildRecords = async (childId: number): Promise<Record[]> => {
  const response = await apiFetch(`/records?childId=${childId}`, {
    method: 'GET',
    mode: 'cors',
    credentials: 'include',
  })

  const jsRes = await response.json()

  if (!response.ok) {
    switch (response.status) {
      case StatusCodes.UNAUTHORIZED:
        throw new Error('Ligipääsuks pead olema autenditud!')
      case StatusCodes.FORBIDDEN:
        throw new Error(jsRes.data.permissions)
      default:
        console.error(jsRes)
        throw new Error('Ootamatu viga: rohkem infot konsoolis.')
    }
  }

  return (jsRes as RecordsAPISuccessResponse).data.records
}

export const childRecordsQueryOptions = (childId: number) =>
  queryOptions({
    queryKey: ['records', 'child', childId],
    queryFn: () => fetchChildRecords(childId),
  })

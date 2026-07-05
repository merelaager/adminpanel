import { queryOptions } from '@tanstack/react-query'

import { client } from '@/api/client.ts'
import { toApiError, unwrapData } from '@/api/errors.ts'

export const fetchShiftEmails = async (
  shiftNr: number,
): Promise<Array<string>> => {
  const { data, error, response } = await client.GET(
    '/api/shifts/{shiftNr}/emails',
    {
      params: { path: { shiftNr } },
    },
  )
  if (error !== undefined) throw toApiError(response.status, error)
  return unwrapData(data).emails
}

export const shiftEmailsQueryOptions = (shiftNr: number) =>
  queryOptions({
    queryKey: ['emails', shiftNr],
    queryFn: () => fetchShiftEmails(shiftNr),
  })

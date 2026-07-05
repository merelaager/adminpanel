import { queryOptions } from '@tanstack/react-query'

import type { paths } from '@/api/schema.gen'
import type { SuccessData } from '@/api/types.ts'
import { client } from '@/api/client.ts'
import { toApiError, unwrapData } from '@/api/errors.ts'

export type ShiftStaffMember = SuccessData<
  paths['/api/shifts/{shiftNr}/staff']['get']
>['staff'][number]

export type StaffCertificate = ShiftStaffMember['certificates'][number]

export const fetchShiftStaff = async (
  shiftNr: number,
): Promise<Array<ShiftStaffMember>> => {
  const { data, error, response } = await client.GET(
    '/api/shifts/{shiftNr}/staff',
    {
      params: { path: { shiftNr } },
    },
  )
  if (error !== undefined) throw toApiError(response.status, error)
  return unwrapData(data).staff
}

export const shiftStaffFetchQueryOptions = (shiftNr: number) =>
  queryOptions({
    queryKey: ['staff', shiftNr],
    queryFn: () => fetchShiftStaff(shiftNr),
  })

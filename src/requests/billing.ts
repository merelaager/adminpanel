import { queryOptions } from '@tanstack/react-query'

import type { paths } from '@/api/schema.gen'
import type { SuccessData } from '@/api/types.ts'
import { client } from '@/api/client.ts'
import { toApiError, unwrapData } from '@/api/errors.ts'

export type ParentBillData = SuccessData<
  paths['/api/shifts/{shiftNr}/billing']['get']
>['records'][number]

export type ChildBillData = ParentBillData['records'][number]

export type BillSummary = NonNullable<ChildBillData['bill']>

export type BillStatus = BillSummary['status']

export const billStatusLabels: Record<BillStatus, string> = {
  paid: 'Makstud',
  open: 'Maksmata',
  'booking-fee-overdue': 'Bronn maksmata',
  'camp-fee-overdue': 'Maksetähtaeg möödas',
  void: 'Tühistatud',
}

export const sendBill = async (email: string) => {
  const { error, response } = await client.POST('/api/notifications/bills', {
    body: { email },
  })
  if (error !== undefined) throw toApiError(response.status, error)
}

export const generateBill = async (email: string) => {
  const { error, response } = await client.POST('/api/bills/', {
    body: { email },
  })
  if (error !== undefined) throw toApiError(response.status, error)
}

export const fetchBillPdf = async (billNr: number) => {
  const { data, error, response } = await client.GET('/api/bills/{billNr}', {
    params: { path: { billNr } },
    parseAs: 'blob',
  })
  if (error !== undefined) throw toApiError(response.status, error)
  return data
}

export const fetchShiftBilling = async (shiftNr: number) => {
  const { data, error, response } = await client.GET(
    '/api/shifts/{shiftNr}/billing',
    {
      params: { path: { shiftNr } },
    },
  )
  if (error !== undefined) throw toApiError(response.status, error)
  return unwrapData(data).records
}

export const shiftBillingFetchQueryOptions = (shiftNr: number) =>
  queryOptions({
    queryKey: ['billing', shiftNr],
    queryFn: () => fetchShiftBilling(shiftNr),
  })

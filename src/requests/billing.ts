import { queryOptions } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'

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
  'booking-fee-paid': 'Bronn tasutud',
  'booking-fee-overdue': 'Bronn maksmata',
  'camp-fee-overdue': 'Maksetähtaeg möödas',
  void: 'Tühistatud',
}

export const sendBill = async (email: string) => {
  const { data, error, response } = await client.POST('/api/bills/send', {
    body: { email },
  })
  if (error !== undefined) throw toApiError(response.status, error)
  return unwrapData(data).billNrs
}

export const fetchBillPdf = async (billNr: number) => {
  const { data, error, response } = await client.GET('/api/bills/{billNr}', {
    params: { path: { billNr } },
    parseAs: 'blob',
  })
  if (error !== undefined) throw toApiError(response.status, error)
  return data
}

export const reissueBill = async (billNr: number) => {
  const { data, error, response } = await client.POST(
    '/api/bills/{billNr}/reissue',
    {
      params: { path: { billNr } },
    },
  )
  if (error !== undefined) throw toApiError(response.status, error)
  return unwrapData(data).billNr
}

export const recordPayment = async (reference: string, amountCents: number) => {
  const { data, error, response } = await client.POST('/api/payments/', {
    body: { reference, amountCents },
  })
  if (error !== undefined) throw toApiError(response.status, error)
  return unwrapData(data).paymentId
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

export type PayerAccount = SuccessData<
  paths['/api/payments/accounts']['get']
>['accounts'][number]

export const fetchPayerAccounts = async () => {
  const { data, error, response } = await client.GET('/api/payments/accounts')
  if (error !== undefined) throw toApiError(response.status, error)
  return unwrapData(data).accounts
}

export const payerAccountsQueryOptions = () =>
  queryOptions({
    queryKey: ['billing', 'accounts'],
    queryFn: fetchPayerAccounts,
  })

export const shiftBillingFetchQueryOptions = (shiftNr: number) =>
  queryOptions({
    queryKey: ['billing', shiftNr],
    queryFn: () => fetchShiftBilling(shiftNr),
  })

export const invalidateBillingQueries = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: ['billing'] }),
    queryClient.invalidateQueries({ queryKey: ['registrations'] }),
  ])

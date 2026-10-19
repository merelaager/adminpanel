import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/table-core'

import type { PayerAccount } from '@/requests/billing.ts'
import { payerAccountsQueryOptions } from '@/requests/billing.ts'
import { formatCents } from '@/lib/money.ts'
import { requireRoot } from '@/lib/roles.ts'

import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import { Switch } from '@/components/ui/switch.tsx'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer.tsx'

import { BillChip } from '@/components/BillChip.tsx'
import { DataTable } from '@/components/data-table.tsx'
import {
  PaymentEntryInput,
  focusFirstPaymentEntry,
} from '@/components/PaymentEntryInput.tsx'

export const Route = createFileRoute('/_auth/maksed')({
  component: RouteComponent,
  beforeLoad: requireRoot,
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(payerAccountsQueryOptions()),
})

type AccountPayment = PayerAccount['payments'][number]

const balanceCents = (account: PayerAccount) =>
  account.billedCents - account.paidCents

const matchesSearch = (account: PayerAccount, needle: string) => {
  const digits = needle.replace(/\s/g, '')
  if (/^\d+$/.test(digits)) {
    return (
      account.reference.includes(digits) ||
      account.bills.some((bill) => String(bill.number).includes(digits))
    )
  }
  return (
    account.name.toLowerCase().includes(needle) ||
    account.email.toLowerCase().includes(needle)
  )
}

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('et-EE', {
    dateStyle: 'short',
    timeStyle: 'short',
  })

type PaymentRow = AccountPayment & { totalAfterCents: number }

const withRunningTotals = (payments: Array<AccountPayment>) => {
  let total = payments.reduce((sum, payment) => sum + payment.amountCents, 0)
  return payments.map((payment): PaymentRow => {
    const row = { ...payment, totalAfterCents: total }
    total -= payment.amountCents
    return row
  })
}

const formatSignedCents = (cents: number) =>
  `${cents > 0 ? '+' : ''}${formatCents(cents)}`

const paymentColumns: Array<ColumnDef<PaymentRow>> = [
  {
    id: 'createdAt',
    header: 'Sisestatud',
    cell: ({ row }) => formatDateTime(row.original.createdAt),
  },
  {
    id: 'amount',
    header: 'Muutus',
    cell: ({ row }) => (
      <span className="font-mono whitespace-nowrap">
        {formatSignedCents(row.original.amountCents)}
      </span>
    ),
  },
  {
    id: 'totalAfter',
    header: 'Makstud',
    cell: ({ row }) => (
      <span className="font-mono whitespace-nowrap">
        {formatCents(row.original.totalAfterCents)}
      </span>
    ),
  },
]

const PayerCell = ({ account }: { account: PayerAccount }) => (
  <Drawer>
    <DrawerTrigger asChild>
      <button
        type="button"
        className="flex flex-col items-start text-left cursor-pointer hover:underline"
      >
        <span>{account.name}</span>
        <span className="text-sm text-muted-foreground font-mono">
          {account.reference}
        </span>
      </button>
    </DrawerTrigger>
    <DrawerContent className="mx-auto w-auto">
      <div className="px-24 pb-24">
        <DrawerHeader>
          <DrawerTitle>{account.name}</DrawerTitle>
          <DrawerDescription>
            {account.email} · viitenumber{' '}
            <span className="font-mono">{account.reference}</span>
          </DrawerDescription>
        </DrawerHeader>
        {account.payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Makseid pole.</p>
        ) : (
          <DataTable
            columns={paymentColumns}
            data={withRunningTotals(account.payments)}
            getRowId={(payment) => String(payment.id)}
          />
        )}
      </div>
    </DrawerContent>
  </Drawer>
)

const Money = ({ cents, prefix }: { cents: number; prefix?: string }) => (
  <span className="font-mono whitespace-nowrap">
    {prefix && `${prefix} `}
    {formatCents(cents)}
  </span>
)

const BalanceCell = ({ account }: { account: PayerAccount }) => {
  const balance = balanceCents(account)
  if (balance === 0) {
    const label = account.billedCents === 0 ? '–' : 'Tasutud'
    return <span className="text-muted-foreground">{label}</span>
  }
  if (balance < 0) return <Money cents={-balance} prefix="Ettemaks" />
  return <Money cents={balance} />
}

const accountColumns: Array<ColumnDef<PayerAccount>> = [
  {
    id: 'payer',
    header: 'Maksja',
    cell: ({ row }) => <PayerCell account={row.original} />,
  },
  {
    id: 'paid',
    header: 'Makstud',
    cell: ({ row }) => (
      <span className="font-mono whitespace-nowrap">
        {formatCents(row.original.paidCents)} /{' '}
        {formatCents(row.original.billedCents)}
      </span>
    ),
  },
  {
    id: 'balance',
    header: 'Jääk',
    cell: ({ row }) => <BalanceCell account={row.original} />,
  },
  {
    id: 'paymentEntry',
    header: 'Lisa makse',
    cell: ({ row }) => (
      <PaymentEntryInput
        reference={row.original.reference}
        payerName={row.original.name}
      />
    ),
  },
  {
    id: 'paymentsUpdatedAt',
    header: 'Viimati uuendatud',
    cell: ({ row }) => {
      const updatedAt = row.original.paymentsUpdatedAt
      return (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {updatedAt === null ? '–' : formatDateTime(updatedAt)}
        </span>
      )
    },
  },
  {
    id: 'bills',
    header: 'Arved',
    cell: ({ row }) => (
      <div className="flex flex-wrap items-center gap-2">
        {row.original.bills.map((bill) => (
          <div key={bill.number} className="flex items-center gap-1">
            <BillChip bill={bill} />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {bill.shiftNrs.join(', ')}. v
            </span>
          </div>
        ))}
      </div>
    ),
  },
]

function RouteComponent() {
  const { data: accounts } = useSuspenseQuery(payerAccountsQueryOptions())
  const [search, setSearch] = React.useState('')
  const [onlyUnpaid, setOnlyUnpaid] = React.useState(false)

  const needle = search.trim().toLowerCase()
  const visibleAccounts = accounts.filter(
    (account) =>
      (!onlyUnpaid || balanceCents(account) > 0) &&
      (needle === '' || matchesSearch(account, needle)),
  )

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && visibleAccounts.length === 1) {
      focusFirstPaymentEntry()
    }
  }

  return (
    <div className="px-6 pb-6 flex flex-col gap-6 overflow-y-scroll h-[calc((100%-var(--spacing)*16))]">
      <div className="flex flex-wrap items-center gap-4">
        <Input
          className="max-w-xs"
          placeholder="Otsi nime, viitenumbri või arve nr järgi"
          aria-label="Otsi maksjat"
          value={search}
          autoFocus
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={onSearchKeyDown}
        />
        <div className="flex items-center space-x-2">
          <Switch
            id="only-unpaid"
            checked={onlyUnpaid}
            onCheckedChange={setOnlyUnpaid}
          />
          <Label htmlFor="only-unpaid">Ainult maksmata</Label>
        </div>
        <span className="ml-auto text-sm text-muted-foreground">
          {visibleAccounts.length} / {accounts.length} maksjat
        </span>
      </div>
      <DataTable
        columns={accountColumns}
        data={visibleAccounts}
        getRowId={(account) => account.reference}
      />
    </div>
  )
}

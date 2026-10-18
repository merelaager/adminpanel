import { createFileRoute } from '@tanstack/react-router'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { toast } from 'sonner'

import { ArrowUpDown } from 'lucide-react'
import type { Column, ColumnDef } from '@tanstack/table-core'
import type {
  BillSummary,
  ChildBillData,
  ParentBillData,
} from '@/requests/billing.ts'
import { requireUser, useUser } from '@/stores/authStore.ts'
import { requireAdmin } from '@/lib/roles.ts'
import { formatCents } from '@/lib/money.ts'

import {
  invalidateBillingQueries,
  sendBill,
  shiftBillingFetchQueryOptions,
} from '@/requests/billing.ts'

import { Button } from '@/components/ui/button.tsx'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer.tsx'

import { BillChip } from '@/components/BillChip.tsx'
import { BillStatusBadge } from '@/components/BillStatusBadge.tsx'
import { DataTable } from '@/components/data-table.tsx'
import { RecordPaymentDialog } from '@/components/RecordPaymentDialog.tsx'

export const Route = createFileRoute('/_auth/arved')({
  component: RouteComponent,
  beforeLoad: requireAdmin,
  loader: ({ context: { queryClient } }) => {
    const shiftNr = requireUser().currentShift
    return queryClient.ensureQueryData(shiftBillingFetchQueryOptions(shiftNr))
  },
})

type ParentSummary = {
  bills: Array<BillSummary>
  unbilledCount: number
  paidCents: number
  totalCents: number
  hasSomethingToSend: boolean
}

const summarizeParent = (parent: ParentBillData): ParentSummary => {
  const bills = new Map<number, BillSummary>()
  let unbilledCount = 0
  for (const record of parent.records) {
    if (record.bill) bills.set(record.bill.number, record.bill)
    else unbilledCount++
  }

  const sortedBills = [...bills.values()].sort((a, b) => a.number - b.number)
  const activeBills = sortedBills.filter((bill) => bill.status !== 'void')

  return {
    bills: sortedBills,
    unbilledCount,
    paidCents: activeBills.reduce((sum, bill) => sum + bill.paidCents, 0),
    totalCents: activeBills.reduce((sum, bill) => sum + bill.totalCents, 0),
    hasSomethingToSend:
      unbilledCount > 0 || activeBills.some((bill) => !bill.sent),
  }
}

const SortableHeader = <T,>({
  column,
  title,
}: {
  column: Column<T>
  title: string
}) => (
  <Button
    variant="ghost"
    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
  >
    {title}
    <ArrowUpDown className="ml-2 h-4 w-4" />
  </Button>
)

const childrenTableColumns: Array<ColumnDef<ChildBillData>> = [
  {
    accessorKey: 'childName',
    header: 'Nimi',
  },
  {
    accessorKey: 'shiftNr',
    header: 'Vahetus',
  },
  {
    accessorKey: 'priceToPay',
    header: 'Hind',
    cell: ({ row }) => `${row.original.priceToPay} €`,
  },
  {
    id: 'billNr',
    header: 'Arve nr',
    cell: ({ row }) => (
      <span className="font-mono">{row.original.bill?.number ?? '–'}</span>
    ),
  },
  {
    id: 'billStatus',
    header: 'Arve seis',
    cell: ({ row }) => {
      const bill = row.original.bill
      return bill ? <BillStatusBadge status={bill.status} /> : 'Arveta'
    },
  },
]

const billTableColumns: Array<ColumnDef<ParentBillData>> = [
  {
    accessorKey: 'name',
    header: ({ column }) => <SortableHeader column={column} title="Nimi" />,
    cell: ({ row }) => {
      const records = [...row.original.records].sort((a, b) =>
        a.childName.localeCompare(b.childName),
      )
      return (
        <Drawer>
          <DrawerTrigger asChild>
            <button
              type="button"
              className="flex flex-col items-start text-left cursor-pointer hover:underline"
            >
              <span>{row.original.name}</span>
              <span className="text-sm text-muted-foreground">
                {row.original.email}
              </span>
            </button>
          </DrawerTrigger>
          <DrawerContent className="mx-auto w-auto">
            <div className="px-24 pb-24">
              <DrawerHeader>
                <DrawerTitle>{row.original.name}</DrawerTitle>
                <DrawerDescription>{row.original.email}</DrawerDescription>
              </DrawerHeader>
              <DataTable columns={childrenTableColumns} data={records} />
            </div>
          </DrawerContent>
        </Drawer>
      )
    },
  },
  {
    accessorKey: 'reference',
    header: 'Viitenumber',
    cell: ({ row }) => (
      <span className="font-mono">{row.original.reference ?? '–'}</span>
    ),
  },
  {
    id: 'bills',
    accessorFn: (row) => summarizeParent(row).bills.at(0)?.number ?? 0,
    header: ({ column }) => <SortableHeader column={column} title="Arved" />,
    cell: ({ row }) => {
      const { bills, unbilledCount } = summarizeParent(row.original)
      return (
        <div className="flex flex-wrap items-center gap-2">
          {bills.map((bill) => (
            <BillChip key={bill.number} bill={bill} />
          ))}
          {unbilledCount > 0 && (
            <span className="text-sm text-muted-foreground">
              {unbilledCount} {unbilledCount === 1 ? 'laps' : 'last'} arveta
            </span>
          )}
        </div>
      )
    },
  },
  {
    id: 'paid',
    header: 'Makstud',
    cell: ({ row }) => {
      const { bills, paidCents, totalCents } = summarizeParent(row.original)
      if (bills.length === 0) return '–'
      return (
        <span className="font-mono whitespace-nowrap">
          {formatCents(paidCents)} / {formatCents(totalCents)}
        </span>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <ParentActions parent={row.original} />,
  },
]

const ParentActions = ({ parent }: { parent: ParentBillData }) => {
  const { isRoot } = useUser()
  return (
    <div className="flex justify-end gap-2">
      <SendBillButton
        name={parent.name}
        email={parent.email}
        hasSomethingToSend={summarizeParent(parent).hasSomethingToSend}
      />
      {isRoot && (
        <RecordPaymentDialog
          reference={parent.reference}
          payerName={parent.name}
        />
      )}
    </div>
  )
}

const SendBillButton = ({
  name,
  email,
  hasSomethingToSend,
}: {
  name: string
  email: string
  hasSomethingToSend: boolean
}) => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => sendBill(email),
    onError: (error: Error) => {
      toast.error('Viga arve saatmisel!', {
        description: error.message,
      })
    },
    onSuccess: (billNrs) => {
      const title =
        billNrs.length === 1
          ? `Arve ${billNrs[0]} saadetud.`
          : `Arved ${billNrs.join(', ')} saadetud.`
      toast.success(title, { description: `Saaja: ${name} (${email})` })
    },
    onSettled: () => invalidateBillingQueries(queryClient),
  })

  return (
    <Button
      variant="outline"
      disabled={!hasSomethingToSend || mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      Saada arve
    </Button>
  )
}

function RouteComponent() {
  const shiftNr = useUser().currentShift

  const { data: records } = useSuspenseQuery(
    shiftBillingFetchQueryOptions(shiftNr),
  )

  const sortedRecords = [...records].sort((a, b) =>
    a.name.localeCompare(b.name),
  )

  return (
    <div className="px-6 pb-6 flex flex-col gap-6 overflow-y-scroll h-[calc((100%-var(--spacing)*16))]">
      <DataTable columns={billTableColumns} data={sortedRecords} />
    </div>
  )
}

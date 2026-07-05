import { createFileRoute } from '@tanstack/react-router'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { toast } from 'sonner'

import { ArrowUpDown } from 'lucide-react'
import type { ColumnDef } from '@tanstack/table-core'
import type { ChildBillData, ParentBillData } from '@/requests/billing.ts'
import { requireUser, useUser } from '@/stores/authStore.ts'
import { updateListItem } from '@/lib/query-cache.ts'
import { requireAdmin } from '@/lib/roles.ts'
import { openBlobInNewTab } from '@/lib/blob.ts'

import {
  fetchBillPdf,
  generateBill,
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
import { Tooltip, TooltipContent } from '@/components/ui/tooltip'
import { TooltipTrigger } from '@/components/ui/tooltip.tsx'

import { DataTable } from '@/components/data-table.tsx'

export const Route = createFileRoute('/_auth/arved')({
  component: RouteComponent,
  beforeLoad: requireAdmin,
  loader: ({ context: { queryClient } }) => {
    const shiftNr = requireUser().currentShift
    queryClient.ensureQueryData(shiftBillingFetchQueryOptions(shiftNr))
  },
})

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
    accessorKey: 'pricePaid',
    header: 'Makstud',
  },
  {
    accessorKey: 'priceToPay',
    header: 'Maksta',
  },
  {
    accessorKey: 'billSent',
    header: 'Arve saadetud?',
    cell: ({ row }) => {
      const billSent = row.original.billSent
      return billSent ? 'Jah' : 'Ei'
    },
  },
]

const billTableColumns: Array<ColumnDef<ParentBillData>> = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Nimi
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    header: 'Makstud',
    cell: ({ row }) => {
      let pricePaid = 0
      row.original.records.forEach((record) => {
        pricePaid += record.pricePaid
      })
      return pricePaid
    },
  },
  {
    header: 'Maksta',
    cell: ({ row }) => {
      let priceToPay = 0
      row.original.records.forEach((record) => {
        priceToPay += record.priceToPay
      })
      return priceToPay
    },
  },
  {
    accessorKey: 'billNr',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Arve nr
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const billNr = row.original.billNr
      const records = [...row.original.records].sort((a, b) =>
        a.childName.localeCompare(b.childName),
      )

      let billSent = true
      records.forEach((record) => {
        if (!record.billSent) billSent = false
      })

      return (
        <div className="flex justify-between items-center gap-2">
          <Drawer>
            <DrawerTrigger asChild>
              <span className="cursor-pointer hover:underline">
                {billNr || '-'}
              </span>
            </DrawerTrigger>
            <DrawerContent className="mx-auto w-auto">
              <div className="px-24 pb-24">
                <DrawerHeader>
                  <DrawerTitle>
                    Arve {billNr || 'pole veel genereeritud'}
                  </DrawerTitle>
                  <DrawerDescription>{row.original.email}</DrawerDescription>
                </DrawerHeader>
                <DataTable columns={childrenTableColumns} data={records} />
              </div>
            </DrawerContent>
          </Drawer>
          <div>
            <GenerateBillButton email={row.original.email} />
            <PrintBillButton billNr={billNr} />
            <SendBillButton
              name={row.original.name}
              email={row.original.email}
              billSent={billSent}
            />
          </div>
        </div>
      )
    },
  },
]

const GenerateBillButton = ({ email }: { email: string }) => {
  const mutation = useMutation({
    mutationFn: (email: string) => {
      return generateBill(email)
    },
    onError: (error: Error) => {
      toast.error('Viga arve genereerimisel!', {
        description: error.message,
      })
    },
  })

  const onClick = () => {
    mutation.mutate(email)
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" className="mr-2" onClick={onClick}>
          Genereeri
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Genereerib uue arve.</p>
      </TooltipContent>
    </Tooltip>
  )
}

const SendBillButton = ({
  name,
  email,
  billSent,
}: {
  name: string
  email: string
  billSent: boolean
}) => {
  const queryClient = useQueryClient()
  const shiftNr = useUser().currentShift

  const mutation = useMutation({
    mutationFn: async (email: string) => {
      await sendBill(email)
      return email
    },
    onError: (error: Error) => {
      toast.error('Viga arve saatmisel!', {
        description: error.message,
      })
    },
    onSuccess: (email) => {
      toast.success('Arve edukalt saadetud.', {
        description: `Saaja: ${name} (${email})`,
      })

      updateListItem<ParentBillData>(
        queryClient,
        shiftBillingFetchQueryOptions(shiftNr).queryKey,
        (r) => r.email === email,
        (r) => ({
          ...r,
          records: r.records.map((record) => ({ ...record, billSent: true })),
        }),
      )
    },
  })

  const onClick = () => {
    mutation.mutate(email)
  }

  return (
    <Button variant="outline" disabled={billSent} onClick={onClick}>
      Saada arve
    </Button>
  )
}

const PrintBillButton = ({ billNr }: { billNr: number | null }) => {
  const print = async () => {
    if (billNr === null) return

    let pdfBlob: Blob

    try {
      pdfBlob = await fetchBillPdf(billNr)
    } catch (err: unknown) {
      toast.warning('Viga arve pärimisel!', {
        description: (err as Error).message,
      })
      return
    }

    openBlobInNewTab(pdfBlob)
  }

  return (
    <Button
      variant="outline"
      className="mr-2"
      disabled={!billNr}
      onClick={print}
    >
      Kuva PDF
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

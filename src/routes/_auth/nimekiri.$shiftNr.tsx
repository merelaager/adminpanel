import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import {
  BadgeEuroIcon,
  ChevronDownIcon,
  ChevronsUpDownIcon,
  ChevronUpIcon,
  MailCheckIcon,
  NotebookText,
} from 'lucide-react'
import { toast } from 'sonner'

import { useAuthStore, type User } from '@/stores/authStore.ts'

import { Button } from '@/components/ui/button.tsx'
import { Switch } from '@/components/ui/switch.tsx'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input.tsx'
import { Badge } from '@/components/ui/badge.tsx'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip.tsx'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx'

import { ChildCounter } from '@/components/ChildCounter.tsx'
import { ShiftNav } from '@/components/ShiftMenu.tsx'

import {
  type ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  type Row,
  type RowData,
  type SortingState,
  type VisibilityState,
} from '@tanstack/table-core'
import { flexRender, useReactTable } from '@tanstack/react-table'

import {
  fetchShiftPdf,
  type PatchKeys,
  type PatchObject,
  patchRegistrations,
  type RegistrationEntry,
  registrationsQueryOptions,
  Sex,
} from '@/requests/registrations.ts'

export const Route = createFileRoute('/_auth/nimekiri/$shiftNr')({
  component: RouteComponent,
  loader: ({ context: { queryClient }, params }) => {
    // TODO: check the shiftNr and redirect to selected shift, if invalid.
    const shiftNrString = params.shiftNr
    const shiftNr = parseInt(shiftNrString, 10)
    queryClient.ensureQueryData(registrationsQueryOptions(shiftNr))
  },
})

type RegistrationGroup = {
  header: string
  rows: RegistrationEntry[]
}

type RegistrationDataTableProps = {
  groups: RegistrationGroup[]
  isDetailView: boolean
  isPriceEditable: boolean
}

type RegistrationMutation = {
  regId: number
  patch: PatchObject
}

// Per-render view flags and mutation handlers are threaded to the cells through
// the table `meta` so the column definitions can stay stable at module scope.
// Recreating them on every render would give each cell a new component identity
// and remount its subtree, tearing down Radix tooltips before they can open.
declare module '@tanstack/table-core' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    isDetailView: boolean
    isPriceEditable: boolean
    updatePrice: (
      e: React.FocusEvent<HTMLInputElement>,
      type: PatchKeys,
      registration: RegistrationEntry,
    ) => void
    toggleRegistration: (registration: RegistrationEntry) => void
  }
}

const registrationColumns: ColumnDef<RegistrationEntry>[] = [
  {
    id: 'name',
    accessorKey: 'child.name',
    header: 'Nimi',
    cell: ({ row, table }) => {
      const registration = row.original
      const { isDetailView } = table.options.meta!
      const isFinanceAvailable = registration.pricePaid !== undefined
      const isPaid = registration.pricePaid === registration.priceToPay
      // The finance badge is only a hint in the simple view; the detail
      // view exposes the underlying price columns instead.
      const displayFinanceBadge = !isDetailView && isFinanceAvailable && isPaid

      return (
        <div className="flex justify-between gap-4">
          {registration.child.name}
          <div className="flex gap-2">
            {registration.addendum ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline">
                    <NotebookText />
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{registration.addendum}</p>
                </TooltipContent>
              </Tooltip>
            ) : null}
            {displayFinanceBadge && (
              <Badge variant="outline">
                <BadgeEuroIcon />
              </Badge>
            )}
          </div>
        </div>
      )
    },
  },
  {
    id: 'isRegistered',
    accessorKey: 'isRegistered',
    header: 'Reg?',
    enableSorting: false,
    cell: ({ row, table }) => (
      <Button
        variant="outline"
        className="w-12"
        onClick={() => table.options.meta!.toggleRegistration(row.original)}
      >
        {row.original.isRegistered ? 'Jah' : 'Ei'}
      </Button>
    ),
  },
  {
    id: 'pricePaid',
    accessorKey: 'pricePaid',
    header: 'Makstud',
    cell: ({ row, table }) =>
      table.options.meta!.isPriceEditable ? (
        <Input
          className="w-16 font-mono"
          defaultValue={row.original.pricePaid}
          onBlur={(e) =>
            table.options.meta!.updatePrice(e, 'pricePaid', row.original)
          }
        />
      ) : (
        <span className="font-mono">{row.original.pricePaid}</span>
      ),
  },
  {
    id: 'priceToPay',
    accessorKey: 'priceToPay',
    header: 'Maksta',
    cell: ({ row, table }) =>
      table.options.meta!.isPriceEditable ? (
        <Input
          className="w-16 font-mono"
          defaultValue={row.original.priceToPay}
          onBlur={(e) =>
            table.options.meta!.updatePrice(e, 'priceToPay', row.original)
          }
        />
      ) : (
        <span className="font-mono">{row.original.priceToPay}</span>
      ),
  },
  {
    id: 'billId',
    accessorKey: 'billId',
    header: 'Arve Nr.',
    cell: ({ row }) => <span className="font-mono">{row.original.billId}</span>,
  },
  {
    id: 'contactName',
    accessorKey: 'contactName',
    header: 'Kontakt',
  },
  {
    id: 'contactEmail',
    accessorKey: 'contactEmail',
    header: 'Meil',
    cell: ({ row }) => (
      <div className="flex justify-between gap-4">
        <a
          href={`mailto:${row.original.contactEmail}`}
          className="hover:underline"
        >
          {row.original.contactEmail}
        </a>
        {row.original.notifSent && (
          <Badge variant="outline">
            <MailCheckIcon />
          </Badge>
        )}
      </div>
    ),
  },
  {
    id: 'isOld',
    accessorKey: 'isOld',
    header: 'Vana?',
    cell: ({ row }) => (row.original.isOld ? 'Jah' : 'Ei'),
  },
  {
    id: 'currentAge',
    accessorKey: 'child.currentAge',
    header: 'Vanus',
    cell: ({ row }) => `${row.original.child.currentAge}a`,
  },
]

export const RegistrationDataTable = ({
  groups,
  isDetailView,
  isPriceEditable,
}: RegistrationDataTableProps) => {
  const queryClient = useQueryClient()

  const data = groups.flatMap((group) => group.rows)
  const shiftNr = data[0]?.shiftNr

  const mutation = useMutation({
    mutationFn: (newState: RegistrationMutation) =>
      patchRegistrations(newState.regId, newState.patch),
    onSuccess: (_, newState) => {
      const staleData = queryClient.getQueryData<RegistrationEntry[]>([
        'registrations',
        shiftNr,
      ])
      if (!staleData) return

      const updatedData = [...staleData]
      const index = updatedData.findIndex((r) => r.id === newState.regId)
      if (index === -1) return

      updatedData[index] = {
        ...updatedData[index],
        ...newState.patch,
      }

      queryClient.setQueryData(['registrations', shiftNr], updatedData)
    },
    onError: (error) => {
      toast.error('Viga andmete uuendamisel!', {
        description: error.message,
      })
    },
  })

  const updatePrice = (
    e: React.FocusEvent<HTMLInputElement>,
    type: PatchKeys,
    registration: RegistrationEntry,
  ) => {
    const price = parseInt(e.target.value, 10)
    if (!price) {
      // Restore the previous value to avoid confusion.
      e.target.value = `${registration[type] ?? ''}`
      return
    }
    mutation.mutate({
      regId: registration.id,
      patch: { [type]: price },
    })
  }

  const toggleRegistration = (registration: RegistrationEntry) => {
    mutation.mutate({
      regId: registration.id,
      patch: { isRegistered: !registration.isRegistered },
    })
  }

  // The detail view reveals the registration toggle and (when available) the
  // finance columns; the contact columns only exist when the data has them.
  const sample = data[0]
  const isFinanceAvailable = sample?.pricePaid !== undefined
  const hasContact = !!sample?.contactName

  const columnVisibility: VisibilityState = {
    isRegistered: isDetailView,
    pricePaid: isDetailView && isFinanceAvailable,
    priceToPay: isDetailView && isFinanceAvailable,
    billId: isDetailView && isFinanceAvailable,
    contactName: hasContact,
    contactEmail: hasContact,
  }

  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns: registrationColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    getRowId: (row) => String(row.id),
    state: { columnVisibility, sorting },
    meta: {
      isDetailView,
      isPriceEditable,
      updatePrice,
      toggleRegistration,
    },
  })

  const visibleColumnCount = table.getVisibleLeafColumns().length

  // Sorting reorders the global row model; we re-bucket the already-sorted rows
  // back into the four sections so the grouping is preserved while each section
  // is sorted internally.
  const sectionRows: { header: string; rows: Row<RegistrationEntry>[] }[] =
    groups.map((group) => ({ header: group.header, rows: [] }))
  const sectionIndexById = new Map<string, number>()
  groups.forEach((group, index) =>
    group.rows.forEach((registration) =>
      sectionIndexById.set(String(registration.id), index),
    ),
  )
  for (const row of table.getRowModel().rows) {
    const index = sectionIndexById.get(row.id)
    if (index !== undefined) sectionRows[index].rows.push(row)
  }

  return (
    <div className="mx-6 rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort()
                const sortDirection = header.column.getIsSorted()
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        className="flex items-center gap-1 select-none"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {sortDirection === 'asc' ? (
                          <ChevronUpIcon className="size-4" />
                        ) : sortDirection === 'desc' ? (
                          <ChevronDownIcon className="size-4" />
                        ) : (
                          <ChevronsUpDownIcon className="size-4 opacity-50" />
                        )}
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {sectionRows.map((section) => (
            <React.Fragment key={section.header}>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableCell
                  colSpan={visibleColumnCount}
                  className="font-medium"
                >
                  {section.header}
                </TableCell>
              </TableRow>
              {section.rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function RouteComponent() {
  const shiftNr = parseInt(Route.useParams().shiftNr, 10)

  // https://github.com/TanStack/router/discussions/1563#discussion-6616426
  const { data: registrations } = useSuspenseQuery(
    registrationsQueryOptions(shiftNr),
  )

  const regCategories: {
    [key: string]: { [key in Sex]: RegistrationEntry[] }
  } = {
    reg: { M: [], F: [] },
    res: { M: [], F: [] },
  }

  registrations.forEach((registration) => {
    if (registration.isRegistered) {
      if (registration.child.sex === Sex.M)
        regCategories.reg.M.push(registration)
      else regCategories.reg.F.push(registration)
    } else {
      if (registration.child.sex === Sex.M)
        regCategories.res.M.push(registration)
      else regCategories.res.F.push(registration)
    }
  })

  const groups: RegistrationGroup[] = [
    { header: 'Poisid', rows: regCategories.reg.M },
    { header: 'Tüdrukud', rows: regCategories.reg.F },
    { header: 'Reserv Poisid', rows: regCategories.res.M },
    { header: 'Reserv Tüdrukud', rows: regCategories.res.F },
  ]

  const [isDetailView, setDetailView] = React.useState(false)
  const [isPriceEditable, setPriceEditable] = React.useState(false)

  const setDetailVisibility = (isDetailed: boolean) => {
    // Prices cannot be edited in the simple view.
    if (isPriceEditable) setPriceEditable(isDetailed)
    setDetailView(isDetailed)
  }

  const setPriceEditingView = (isEditable: boolean) => {
    // Price editing requires the detailed view.
    if (!isDetailView) setDetailView(isEditable)
    setPriceEditable(isEditable)
  }

  const print = async () => {
    const pdfBlob = await fetchShiftPdf(shiftNr)

    const obj = {
      filename: `${shiftNr}v_nimekiri.pdf`,
      blob: pdfBlob,
    }

    const newBlob = new Blob([obj.blob], { type: 'application/pdf' })
    const objUrl = window.URL.createObjectURL(newBlob)
    window.open(objUrl, '_blank')
  }

  const displayPrintButton =
    registrations.length > 0 &&
    registrations[0].birthday !== undefined &&
    registrations[0].contactEmail !== undefined
  const displayPriceEditSwitch = (useAuthStore.getState().user as User).isRoot

  return (
    <div className="pb-6 overflow-y-scroll h-[calc((100%-var(--spacing)*16))]">
      <div className="px-6 flex flex-wrap gap-4 sticky top-0 z-10 bg-white pb-4">
        <ShiftNav />
        {displayPrintButton && (
          <Button variant="outline" onClick={print}>
            Prindi
          </Button>
        )}
        <div className="flex items-center space-x-2">
          <Switch
            id="detail-view"
            checked={isDetailView}
            onCheckedChange={() => setDetailVisibility(!isDetailView)}
          />
          <Label htmlFor="detail-view">Detailvaade</Label>
        </div>
        {displayPriceEditSwitch && (
          <div className="flex items-center space-x-2">
            <Switch
              id="price-editable"
              checked={isPriceEditable}
              onCheckedChange={() => setPriceEditingView(!isPriceEditable)}
            />
            <Label htmlFor="price-editable">Majanda</Label>
          </div>
        )}
      </div>
      <ChildCounter
        regMCount={regCategories.reg.M.length}
        regFCount={regCategories.reg.F.length}
        resMCount={regCategories.res.M.length}
        resFCount={regCategories.res.F.length}
      />
      <RegistrationDataTable
        groups={groups}
        isDetailView={isDetailView}
        isPriceEditable={isPriceEditable}
      />
    </div>
  )
}

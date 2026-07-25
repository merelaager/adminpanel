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
  DownloadIcon,
  ListFilterIcon,
  MailCheckIcon,
  MarsIcon,
  NotebookText,
  VenusIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import type {
  Column,
  ColumnDef,
  ColumnFiltersState,
  RowData,
  SortingState,
  VisibilityState,
} from '@tanstack/table-core'
import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
} from '@tanstack/table-core'
import { flexRender, useReactTable } from '@tanstack/react-table'
import type {
  PatchKeys,
  PatchObject,
  RegistrationEntry,
} from '@/requests/registrations.ts'
import {
  fetchShiftPdf,
  patchRegistrations,
  registrationsQueryOptions,
  Sex,
} from '@/requests/registrations.ts'
import { useUser } from '@/stores/authStore.ts'

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
import { ChildRecordsSheet } from '@/components/ChildRecordsSheet.tsx'
import { ShiftNav } from '@/components/ShiftMenu.tsx'

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx'
import { updateListItem } from '@/lib/query-cache.ts'
import { openBlobInNewTab } from '@/lib/blob.ts'
import { downloadTableCsv } from '@/lib/csv.ts'

export const Route = createFileRoute('/_auth/nimekiri/$shiftNr')({
  component: RouteComponent,
  loader: ({ context: { queryClient }, params }) => {
    // TODO: check the shiftNr and redirect to selected shift, if invalid.
    const shiftNrString = params.shiftNr
    const shiftNr = parseInt(shiftNrString, 10)
    return queryClient.ensureQueryData(registrationsQueryOptions(shiftNr))
  },
})

type RegistrationDataTableProps = {
  title: string
  registrations: Array<RegistrationEntry>
  shiftNr: number
  isDetailView: boolean
  isPriceEditable: boolean
  showSearch?: boolean
}

type RegistrationMutation = {
  regId: number
  patch: PatchObject
}

declare module '@tanstack/table-core' {
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

  interface ColumnMeta<TData extends RowData, TValue> {
    csvHeader?: string
    csvValue?: (row: TData) => string | number | null | undefined
  }
}

const SexFilterHeader = ({
  column,
}: {
  column: Column<RegistrationEntry, unknown>
}) => {
  const selected = column.getFilterValue() as Array<Sex> | undefined

  const isChecked = (sex: Sex) =>
    selected === undefined ? true : selected.includes(sex)

  const toggle = (sex: Sex, checked: boolean) => {
    const current = selected ?? [Sex.M, Sex.F]
    const next = checked
      ? Array.from(new Set([...current, sex]))
      : current.filter((s) => s !== sex)
    column.setFilterValue(next.length === 2 ? undefined : next)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="flex items-center gap-1 select-none">
          Sugu
          <ListFilterIcon
            className={`size-4 ${selected === undefined ? 'opacity-50' : ''}`}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuCheckboxItem
          checked={isChecked(Sex.M)}
          onCheckedChange={(checked) => toggle(Sex.M, checked)}
          onSelect={(e) => e.preventDefault()}
        >
          <MarsIcon className="size-4" />
          Poisid
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={isChecked(Sex.F)}
          onCheckedChange={(checked) => toggle(Sex.F, checked)}
          onSelect={(e) => e.preventDefault()}
        >
          <VenusIcon className="size-4" />
          Tüdrukud
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const registrationColumns: Array<ColumnDef<RegistrationEntry>> = [
  {
    id: 'name',
    accessorKey: 'child.name',
    header: 'Nimi',
    meta: { csvHeader: 'Nimi', csvValue: (row) => row.child.name },
    cell: ({ row, table }) => {
      const registration = row.original
      const { isDetailView } = table.options.meta!
      const isFinanceAvailable = registration.pricePaid !== undefined
      const isPaid = registration.pricePaid === registration.priceToPay

      const displayFinanceBadge = !isDetailView && isFinanceAvailable && isPaid

      return (
        <div className="flex justify-between gap-4">
          <ChildRecordsSheet
            childId={registration.childId}
            childName={registration.child.name}
          />
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
    meta: {
      csvHeader: 'Reg?',
      csvValue: (row) => (row.isRegistered ? 'Jah' : 'Ei'),
    },
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
    meta: { csvHeader: 'Makstud', csvValue: (row) => row.pricePaid },
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
    meta: { csvHeader: 'Maksta', csvValue: (row) => row.priceToPay },
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
    meta: { csvHeader: 'Arve Nr.', csvValue: (row) => row.billId },
    cell: ({ row }) => <span className="font-mono">{row.original.billId}</span>,
  },
  {
    id: 'contactName',
    accessorKey: 'contactName',
    header: 'Kontakt',
    meta: { csvHeader: 'Kontakt', csvValue: (row) => row.contactName },
  },
  {
    id: 'contactEmail',
    accessorKey: 'contactEmail',
    header: 'Meil',
    meta: { csvHeader: 'Meil', csvValue: (row) => row.contactEmail },
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
    id: 'sex',
    accessorKey: 'child.sex',
    header: ({ column }) => <SexFilterHeader column={column} />,
    meta: { csvHeader: 'Sugu', csvValue: (row) => row.child.sex },
    enableSorting: false,
    filterFn: (row, columnId, filterValue: Array<Sex>) =>
      filterValue.includes(row.getValue(columnId)),
    cell: ({ row }) =>
      row.original.child.sex === Sex.M ? (
        <MarsIcon className="size-4" />
      ) : (
        <VenusIcon className="size-4" />
      ),
  },
  {
    id: 'isOld',
    accessorKey: 'isOld',
    header: 'Vana?',
    meta: { csvHeader: 'Vana?', csvValue: (row) => (row.isOld ? 'Jah' : 'Ei') },
    cell: ({ row }) => (row.original.isOld ? 'Jah' : 'Ei'),
  },
  {
    id: 'currentAge',
    accessorKey: 'child.currentAge',
    header: 'Vanus',
    meta: { csvHeader: 'Vanus', csvValue: (row) => row.child.currentAge },
    cell: ({ row }) => `${row.original.child.currentAge}a`,
  },
]

export const RegistrationDataTable = ({
  title,
  registrations,
  shiftNr,
  isDetailView,
  isPriceEditable,
  showSearch = false,
}: RegistrationDataTableProps) => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (newState: RegistrationMutation) =>
      patchRegistrations(newState.regId, newState.patch),
    onSuccess: (_, newState) => {
      updateListItem<RegistrationEntry>(
        queryClient,
        registrationsQueryOptions(shiftNr).queryKey,
        (r) => r.id === newState.regId,
        (r) => ({ ...r, ...newState.patch }),
      )
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

  const sample = registrations.at(0)
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
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  )
  const [globalFilter, setGlobalFilter] = React.useState('')

  const table = useReactTable({
    data: registrations,
    columns: registrationColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, value) => {
      const needle = String(value).toLowerCase()
      const { child, contactName, contactEmail } = row.original
      return [child.name, contactName, contactEmail].some((field) =>
        field?.toLowerCase().includes(needle),
      )
    },
    getRowId: (row) => String(row.id),
    state: { columnVisibility, sorting, columnFilters, globalFilter },
    meta: {
      isDetailView,
      isPriceEditable,
      updatePrice,
      toggleRegistration,
    },
  })

  return (
    <div>
      <div className="px-6 pt-4 pb-2 flex items-center gap-4">
        <h2 className="font-semibold">{title}</h2>
        {showSearch && (
          <Input
            className="max-w-xs"
            placeholder="Otsi..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        )}
        {registrations.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() =>
              downloadTableCsv(table, `${title.toLowerCase()}-${shiftNr}v.csv`)
            }
          >
            <DownloadIcon />
            CSV
          </Button>
        )}
      </div>
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
                        <span className="flex items-center gap-1">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        </span>
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function RouteComponent() {
  const shiftNr = parseInt(Route.useParams().shiftNr, 10)

  // https://github.com/TanStack/router/discussions/1563#discussion-6616426
  const { data: registrations } = useSuspenseQuery(
    registrationsQueryOptions(shiftNr),
  )

  const { regCategories, registeredCampers, reserveCampers } =
    React.useMemo(() => {
      const categories: {
        [key: string]: { [key in Sex]: Array<RegistrationEntry> }
      } = {
        reg: { M: [], F: [] },
        res: { M: [], F: [] },
      }

      registrations.forEach((registration) => {
        const bucket = registration.isRegistered
          ? categories.reg
          : categories.res
        if (registration.child.sex === Sex.M) bucket.M.push(registration)
        else bucket.F.push(registration)
      })

      return {
        regCategories: categories,
        registeredCampers: [...categories.reg.M, ...categories.reg.F],
        reserveCampers: [...categories.res.M, ...categories.res.F],
      }
    }, [registrations])

  const [isDetailView, setDetailView] = React.useState(false)
  const [isPriceEditable, setPriceEditable] = React.useState(false)

  const setDetailVisibility = (isDetailed: boolean) => {
    if (isPriceEditable) setPriceEditable(isDetailed)
    setDetailView(isDetailed)
  }

  const setPriceEditingView = (isEditable: boolean) => {
    if (!isDetailView) setDetailView(isEditable)
    setPriceEditable(isEditable)
  }

  const print = async () => {
    let pdfBlob: Blob
    try {
      pdfBlob = await fetchShiftPdf(shiftNr)
    } catch (err) {
      toast.warning('Viga nimekirja pärimisel!', {
        description: (err as Error).message,
      })
      return
    }
    openBlobInNewTab(pdfBlob)
  }

  const displayPrintButton =
    registrations.length > 0 &&
    registrations[0].birthday !== undefined &&
    registrations[0].contactEmail !== undefined
  const displayPriceEditSwitch = useUser().isRoot

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
        title="Põhinimekiri"
        registrations={registeredCampers}
        shiftNr={shiftNr}
        isDetailView={isDetailView}
        isPriceEditable={isPriceEditable}
        showSearch
      />
      <RegistrationDataTable
        title="Reserv"
        registrations={reserveCampers}
        shiftNr={shiftNr}
        isDetailView={isDetailView}
        isPriceEditable={isPriceEditable}
      />
    </div>
  )
}

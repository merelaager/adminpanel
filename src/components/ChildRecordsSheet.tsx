import * as React from 'react'
import { useQuery } from '@tanstack/react-query'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet.tsx'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx'
import { childRecordsQueryOptions } from '@/requests/records.ts'

export const ChildRecordsSheet = ({
  childId,
  childName,
}: {
  childId: number
  childName: string
}) => {
  const [open, setOpen] = React.useState(false)

  const {
    data: records,
    isLoading,
    isError,
    error,
  } = useQuery({
    ...childRecordsQueryOptions(childId),
    enabled: open,
  })

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button type="button" className="text-left hover:underline">
          {childName}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{childName}</SheetTitle>
          <SheetDescription>Ajalugu</SheetDescription>
        </SheetHeader>
        <div className="overflow-auto px-4 pb-4">
          {isLoading && <p className="text-muted-foreground">Laen…</p>}
          {isError && (
            <p className="text-destructive">
              {error instanceof Error
                ? error.message
                : 'Viga andmete laadimisel'}
            </p>
          )}
          {records && records.length === 0 && (
            <p className="text-muted-foreground">Kirjeid ei leitud.</p>
          )}
          {records && records.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aasta</TableHead>
                  <TableHead>Vahetus</TableHead>
                  <TableHead>Meeskond</TableHead>
                  <TableHead>Telk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.year}</TableCell>
                    <TableCell>{record.shiftNr}</TableCell>
                    <TableCell>{record.teamName ?? '–'}</TableCell>
                    <TableCell>{record.tentNr ?? '–'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

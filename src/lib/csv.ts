import type { Table } from '@tanstack/table-core'
import { downloadBlob } from '@/lib/blob.ts'

const escapeCell = (value: unknown): string => {
  const str = value === undefined || value === null ? '' : String(value)
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

export const downloadTableCsv = <T>(table: Table<T>, filename: string) => {
  const columns = table.getVisibleLeafColumns()

  const header = columns.map((col) => col.columnDef.meta?.csvHeader ?? col.id)
  const rows = table.getRowModel().rows.map((row) =>
    columns.map((col) => {
      const csvValue = col.columnDef.meta?.csvValue
      return csvValue ? csvValue(row.original) : row.getValue(col.id)
    }),
  )

  const body = [header, ...rows]
    .map((cells) => cells.map(escapeCell).join(','))
    .join('\r\n')

  const blob = new Blob(['﻿' + body], {
    type: 'text/csv;charset=utf-8',
  })
  downloadBlob(blob, filename)
}

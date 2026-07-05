import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type {
  CamperRecord,
  RecordPatchObject,
} from '@/requests/shift-records.ts'
import { updateListItem } from '@/lib/query-cache.ts'
import {
  patchShiftRecord,
  shiftRecordsFetchQueryOptions,
} from '@/requests/shift-records.ts'

export const usePatchShiftRecord = (record: CamperRecord) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (patchData: RecordPatchObject) =>
      patchShiftRecord(record.id, patchData),
    onSuccess: (_, newState) => {
      updateListItem<CamperRecord>(
        queryClient,
        shiftRecordsFetchQueryOptions(record.shiftNr).queryKey,
        (r) => r.id === record.id,
        (r) => ({ ...r, ...newState }),
      )
    },
    onError: (error: Error) => {
      toast.error('Viga andmete uuendamisel!', {
        description: error.message,
      })
    },
  })
}

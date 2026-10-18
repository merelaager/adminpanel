import { useMutation, useQueryClient } from '@tanstack/react-query'
import { RotateCcwIcon } from 'lucide-react'
import { toast } from 'sonner'

import { invalidateBillingQueries, reissueBill } from '@/requests/billing.ts'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog.tsx'
import { Button } from '@/components/ui/button.tsx'

export const ReissueBillButton = ({ billNr }: { billNr: number }) => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => reissueBill(billNr),
    onError: (error: Error) => {
      toast.error('Viga arve asendamisel!', { description: error.message })
    },
    onSuccess: (replacementNr) => {
      if (replacementNr === null) {
        toast.success(`Arve ${billNr} tühistatud.`, {
          description: 'Ükski lastest ei ole enam registreeritud.',
        })
        return
      }
      toast.success(`Arve ${billNr} asendatud arvega ${replacementNr}.`, {
        description: 'Saada uus arve nupuga „Saada arve“.',
      })
    },
    onSettled: () => invalidateBillingQueries(queryClient),
  })

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          title={`Asenda arve ${billNr}`}
          disabled={mutation.isPending}
        >
          <RotateCcwIcon />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Asenda arve {billNr}?</AlertDialogTitle>
          <AlertDialogDescription>
            Asendades arve, tühistad olemasoleva arve ja lood uue arve uuendatud
            hindade ja infoga. Juba laekunud maksed lähevad uue arve alla kirja.
            Uut arvet süsteem saajale automaatselt ei saada.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Tühista</AlertDialogCancel>
          <AlertDialogAction onClick={() => mutation.mutate()}>
            Asenda arve
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

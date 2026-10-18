import * as React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { formatCents, parseEurosToCents } from '@/lib/money.ts'
import { invalidateBillingQueries, recordPayment } from '@/requests/billing.ts'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog.tsx'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'

const paymentFormSchema = z.object({
  amount: z
    .string()
    .refine(
      (value) => parseEurosToCents(value) !== null,
      'Sisesta summa eurodes, nt 100 või 12,50.',
    )
    .refine((value) => parseEurosToCents(value) !== 0, 'Summa ei saa olla 0.'),
})

type PaymentFormValues = z.infer<typeof paymentFormSchema>

type PaymentToRecord = { reference: string; amountCents: number }

export const RecordPaymentDialog = ({
  reference,
  payerName,
}: {
  reference: string | null
  payerName: string
}) => {
  const [open, setOpen] = React.useState(false)
  const queryClient = useQueryClient()

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: { amount: '' },
  })

  const onOpenChange = (isOpen: boolean) => {
    if (isOpen) form.reset({ amount: '' })
    setOpen(isOpen)
  }

  const mutation = useMutation({
    mutationFn: (payment: PaymentToRecord) =>
      recordPayment(payment.reference, payment.amountCents),
    onError: (error: Error) => {
      toast.error('Viga makse lisamisel!', { description: error.message })
    },
    onSuccess: (_, payment) => {
      toast.success(`Makse ${formatCents(payment.amountCents)} lisatud.`, {
        description: `${payerName}, viitenumber ${payment.reference}`,
      })
      setOpen(false)
    },
    onSettled: () => invalidateBillingQueries(queryClient),
  })

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={reference === null}>
          Lisa makse
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Lisa makse</AlertDialogTitle>
          <AlertDialogDescription>
            {payerName} (viitenumber{' '}
            <span className="font-mono">{reference}</span>)
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Form {...form}>
          <form
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((values) => {
              if (reference === null) return
              mutation.mutate({
                reference,
                amountCents: parseEurosToCents(values.amount)!,
              })
            })}
          >
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summa (€)</FormLabel>
                  <FormControl>
                    <Input inputMode="decimal" autoFocus {...field} />
                  </FormControl>
                  <FormDescription>
                    Summa vähendamiseks lisa maksele miinus ette.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <AlertDialogFooter>
              <AlertDialogCancel type="button">Tühista</AlertDialogCancel>
              <Button type="submit" disabled={mutation.isPending}>
                Lisa makse
              </Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  )
}

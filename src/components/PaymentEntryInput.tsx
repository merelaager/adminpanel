import * as React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { formatCents, parseEurosToCents } from '@/lib/money.ts'
import { cn } from '@/lib/utils.ts'
import { invalidateBillingQueries, recordPayment } from '@/requests/billing.ts'

import { Input } from '@/components/ui/input.tsx'

const ENTRY_SELECTOR = 'input[data-payment-entry]'

const findNextEntry = (current: HTMLInputElement) => {
  const entries = [
    ...document.querySelectorAll<HTMLInputElement>(ENTRY_SELECTOR),
  ]
  const index = entries.indexOf(current)
  return index === -1 ? null : (entries.at(index + 1) ?? null)
}

export const focusFirstPaymentEntry = () =>
  document.querySelector<HTMLInputElement>(ENTRY_SELECTOR)?.focus()

export const PaymentEntryInput = ({
  reference,
  payerName,
}: {
  reference: string
  payerName: string
}) => {
  const [value, setValue] = React.useState('')
  const [isInvalid, setInvalid] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const nextEntryRef = React.useRef<HTMLInputElement | null>(null)
  // Guards against saving twice.
  const isSavingRef = React.useRef(false)
  const queryClient = useQueryClient()

  const undo = async (amountCents: number) => {
    try {
      await recordPayment(reference, -amountCents)
      toast.success(`Makse ${formatCents(amountCents)} võeti tagasi.`, {
        description: `${payerName}, viitenumber ${reference}`,
      })
    } catch (err: unknown) {
      toast.error('Viga makse tühistamisel!', {
        description: (err as Error).message,
      })
    } finally {
      await invalidateBillingQueries(queryClient)
    }
  }

  const mutation = useMutation({
    mutationFn: (amountCents: number) => recordPayment(reference, amountCents),
    onError: (error: Error) => {
      toast.error('Viga makse lisamisel!', { description: error.message })
    },
    onSuccess: (_, amountCents) => {
      toast.success(`Makse ${formatCents(amountCents)} lisatud.`, {
        description: `${payerName}, viitenumber ${reference}`,
        action: { label: 'Võta tagasi', onClick: () => undo(amountCents) },
      })
      setValue('')
      if (document.activeElement === inputRef.current) {
        nextEntryRef.current?.focus()
      }
    },
    onSettled: () => {
      isSavingRef.current = false
      return invalidateBillingQueries(queryClient)
    },
  })

  const save = (next: HTMLInputElement | null) => {
    if (isSavingRef.current || value.trim() === '') return true

    const amountCents = parseEurosToCents(value)
    if (amountCents === null || amountCents === 0) {
      setInvalid(true)
      return false
    }

    isSavingRef.current = true
    nextEntryRef.current = next
    mutation.mutate(amountCents)
    return true
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setValue('')
      setInvalid(false)
    } else if (e.key === 'Enter') {
      save(findNextEntry(e.currentTarget))
    }
  }

  const onBlur = () => {
    if (!save(null)) {
      toast.warning('Makse jäi lisamata!', {
        description: `${payerName}: „${value}“ ei ole korrektne summa.`,
      })
    }
  }

  return (
    <Input
      ref={inputRef}
      data-payment-entry
      className={cn(
        'w-28 font-mono',
        isInvalid && 'border-destructive focus-visible:ring-destructive/40',
      )}
      inputMode="decimal"
      placeholder="€"
      title={
        isInvalid
          ? 'Sisesta summa eurodes, nt 100 või 12,50.'
          : 'Makse lisatakse, kui vajutad Enter või lahkud väljalt. Negatiivne summa tühistab makse.'
      }
      aria-invalid={isInvalid}
      aria-label={`Lisa makse: ${payerName}`}
      value={value}
      readOnly={mutation.isPending}
      onChange={(e) => {
        setValue(e.target.value)
        setInvalid(false)
      }}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    />
  )
}

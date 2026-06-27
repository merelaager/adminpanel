import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQueries } from '@tanstack/react-query'

import { getUserShift } from '@/utils.ts'
import { registrationsQueryOptions } from '@/requests/registrations.ts'
import { Button } from '@/components/ui/button.tsx'

export const Route = createFileRoute('/_auth/meilid')({
  component: RouteComponent,
  loader: ({ context: { queryClient } }) => {
    const shiftNr = getUserShift()
    return queryClient.ensureQueryData(registrationsQueryOptions(shiftNr))
  },
})

function RouteComponent() {
  const shiftNr = getUserShift()

  const results = useSuspenseQueries({
    queries: [registrationsQueryOptions(shiftNr)],
  })

  const emails = React.useMemo(() => {
    const seen = new Set<string>()
    for (const result of results) {
      for (const reg of result.data) {
        if (reg.isRegistered && reg.contactEmail) seen.add(reg.contactEmail)
      }
    }
    return Array.from(seen).sort()
  }, [results])

  const download = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const filename = `${shiftNr}v-meilid-${date}.txt`
    const blob = new Blob([emails.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 overflow-y-scroll h-[calc((100%-var(--spacing)*16))]">
      <div className="flex items-center gap-4 mb-4">
        <h1 className="font-semibold">Meilid</h1>
        <Button variant="outline" size="sm" onClick={download}>
          Lae alla
        </Button>
      </div>
      <p className="text-sm leading-relaxed">{emails.join(', ')}</p>
    </div>
  )
}

import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQueries } from '@tanstack/react-query'

import { getUserShift } from '@/utils.ts'
import { registrationsQueryOptions } from '@/requests/registrations.ts'

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

  return (
    <div className="p-6 overflow-y-scroll h-[calc((100%-var(--spacing)*16))]">
      <h1 className="font-semibold mb-4">Meilid</h1>
      <p className="text-sm leading-relaxed">{emails.join(', ')}</p>
    </div>
  )
}

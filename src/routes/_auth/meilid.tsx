import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'

import { requireUser, useUser } from '@/stores/authStore.ts'
import { shiftEmailsQueryOptions } from '@/requests/shift-emails.ts'
import { Button } from '@/components/ui/button.tsx'
import { requireAdmin } from '@/lib/roles.ts'

export const Route = createFileRoute('/_auth/meilid')({
  component: RouteComponent,
  beforeLoad: requireAdmin,
  loader: ({ context: { queryClient } }) => {
    return queryClient.ensureQueryData(
      shiftEmailsQueryOptions(requireUser().currentShift),
    )
  },
})

function RouteComponent() {
  const shiftNr = useUser().currentShift

  const { data } = useSuspenseQuery(shiftEmailsQueryOptions(shiftNr))
  const emails = [...data].sort()

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

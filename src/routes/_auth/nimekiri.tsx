import { createFileRoute, redirect } from '@tanstack/react-router'

import { Route as registrationRoute } from './nimekiri.$shiftNr.tsx'

import { requireUser } from '@/stores/authStore.ts'

export const Route = createFileRoute('/_auth/nimekiri')({
  loader: () => {
    // This is stupid but necessary due to Tanstack Router's routing.
    // Without this, and infinite loop will be created, because
    // /nimekiri/ is always matched before /nimekiri/:shiftNr, even
    // when visiting /nimekiri/:shiftNr.
    // https://github.com/TanStack/router/issues/2142#issuecomment-2295518011
    const shouldRedirect = [`/nimekiri`, `/nimekiri/`].includes(
      location.pathname,
    )
    if (!shouldRedirect) return

    throw redirect({
      to: registrationRoute.to,
      params: { shiftNr: `${requireUser().currentShift}` },
    })
  },
})

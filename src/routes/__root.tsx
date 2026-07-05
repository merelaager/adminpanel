import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import type { QueryClient } from '@tanstack/react-query'

import { Toaster } from '@/components/ui/sonner.tsx'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <Toaster position="top-center" />
      <Outlet />
      <TanStackRouterDevtools position="bottom-right" />
    </>
  ),
})

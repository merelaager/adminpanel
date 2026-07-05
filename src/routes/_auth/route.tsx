import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { Route as loginRoute } from '../login.tsx'
import { useAuthStore, useUser } from '@/stores/authStore.ts'

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar.tsx'

import { AppSidebar } from '@/components/app-sidebar.tsx'

export const Route = createFileRoute('/_auth')({
  component: AppLayoutComponent,
  beforeLoad: ({ location }) => {
    const user = useAuthStore.getState().user
    if (!user) {
      throw redirect({
        to: loginRoute.to,
        search: {
          redirect: location.href,
        },
      })
    }
  },
})

function AppLayoutComponent() {
  const user = useUser()

  return (
    <div className="h-full">
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full max-h-screen overflow-hidden">
          <header className="sticky top-0 bg-white flex h-16 items-center justify-between px-6">
            <SidebarTrigger />
            <div>{user.nickname || user.name}</div>
          </header>
          <Outlet />
        </main>
      </SidebarProvider>
    </div>
  )
}

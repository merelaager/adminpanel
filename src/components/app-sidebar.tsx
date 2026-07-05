import { Link } from '@tanstack/react-router'

import { ChevronsUpDown } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Route as homeRoute } from '../routes/_auth/index.tsx'
import { Route as registrationsRoute } from '../routes/_auth/nimekiri.tsx'
import { Route as billsRoute } from '../routes/_auth/arved.tsx'
import { Route as permissionsRoute } from '../routes/_auth/oigused.tsx'
import { Route as tentsRoute } from '../routes/_auth/telgid.index.tsx'
import { Route as teamsRoute } from '../routes/_auth/meeskonnad.tsx'
import { Route as timerRoute } from '../routes/_auth/taimer.tsx'
import { Route as gradesRoute } from '../routes/_auth/hinded.tsx'
import { Route as shirtsRoute } from '../routes/_auth/sargid.tsx'
import { Route as statsRoute } from '../routes/_auth/statistika.tsx'
import { Route as emailsRoute } from '../routes/_auth/meilid.tsx'

import type { PatchUserBody } from '@/requests/user.ts'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx'
import { patchUser } from '@/requests/user.ts'
import { useAuthStore, useUser } from '@/stores/authStore.ts'
import { isAdminRole } from '@/lib/roles.ts'

const topItems = [
  {
    title: 'Kambüüs',
    url: homeRoute.to,
  },
]

const shiftItems = [
  {
    title: 'Telgid',
    url: tentsRoute.to,
  },
  {
    title: 'Meeskonnad',
    url: teamsRoute.to,
  },
  {
    title: 'Hinded',
    url: gradesRoute.to,
  },
  {
    title: 'Taimer',
    url: timerRoute.to,
  },
]

const adminItems: Array<{
  title: string
  url: string
  adminOnly?: boolean
}> = [
  {
    title: 'Nimekiri',
    url: registrationsRoute.to,
  },
  {
    title: 'Arved',
    url: billsRoute.to,
    adminOnly: true,
  },
  {
    title: 'T-särgid',
    url: shirtsRoute.to,
    adminOnly: true,
  },
  {
    title: 'Õigused',
    url: permissionsRoute.to,
    adminOnly: true,
  },
  {
    title: 'Statistika',
    url: statsRoute.to,
  },
  {
    title: 'Meilid',
    url: emailsRoute.to,
    adminOnly: true,
  },
]

const ShiftSwitcher = () => {
  const user = useUser()
  const currentShift = user.currentShift
  const shifts = user.managedShifts
  const userId = user.userId

  const updateCurrentShift = useAuthStore((state) => state.updateCurrentShift)
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (data: PatchUserBody) => {
      if (data.currentShift === undefined) {
        throw new Error('Vahetuse numbrit ei õnnestunud töödelda.')
      }
      await patchUser(userId, data)
      return data.currentShift
    },
    onError: (error) => {
      toast.error('Viga vahetuse vahetamisel!', {
        description: error.message,
      })
    },
    onSuccess: async (newShift) => {
      updateCurrentShift(newShift)
      await queryClient.invalidateQueries()
    },
  })

  const changeShift = (newShift: number) => {
    mutation.mutate({ currentShift: newShift })
  }

  if (shifts.length === 1) {
    return (
      <div className="p-2">
        <div className="p-2">
          <span>{currentShift}. vahetus</span>
        </div>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <span className="font-medium">{currentShift}. vahetus</span>
          <ChevronsUpDown className="ml-auto" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width)"
        align="start"
      >
        {shifts
          .filter((shift) => shift !== currentShift)
          .map((shift) => {
            return (
              <DropdownMenuItem key={shift} onSelect={() => changeShift(shift)}>
                {shift}. vahetus
              </DropdownMenuItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppSidebar() {
  const currentRole = useUser().currentRole
  const isAdmin = isAdminRole(currentRole)

  return (
    <Sidebar>
      {/* <SidebarHeader />*/}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="p-6">
              <Link to={homeRoute.to} className="block w-[50px]">
                <img
                  src="https://merelaager.ee/img/merelaager_ship.svg"
                  alt="Merelaagri logo"
                />
              </Link>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            {topItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <Link to={item.url}>
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            {shiftItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <Link to={item.url}>
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            {adminItems.map((item) => {
              if (item.adminOnly && !isAdmin) return null
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url}>
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {/* <SidebarMenu>*/}
        {/*  <SidebarMenuItem>*/}
        <ShiftSwitcher />
        {/*  </SidebarMenuItem>*/}
        {/* </SidebarMenu>*/}
      </SidebarFooter>
    </Sidebar>
  )
}
